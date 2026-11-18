"""Pack the approved PSD renders as static plates and per-slot inverse warp maps."""
import argparse
import gzip
import json
from pathlib import Path
import shutil

import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("probes", type=Path)
parser.add_argument("output", type=Path)
parser.add_argument("ids", nargs="+", choices=["3", "9", "10", "11"])
args = parser.parse_args()


def rgb(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.int16)


for model in args.ids:
    source = Path(__file__).parent / "templates" / f"template-{model}.json"
    template = json.loads(source.read_text(encoding="utf-8"))
    target = args.output / model
    target.mkdir(parents=True, exist_ok=True)
    base_path = args.probes / f"{model}-base.png"
    base = rgb(base_path)
    shutil.copyfile(base_path, target / "base.png")
    manifest = {
        "width": base.shape[1], "height": base.shape[0],
        "density": template["document"]["resolution"], "slots": [],
    }
    with Image.open(base_path) as image:
        if profile := image.info.get("icc_profile"):
            manifest["profile"] = "profile.icc"
            (target / manifest["profile"]).write_bytes(profile)
    for slot in template["slots"]:
        prefix = args.probes / f"{model}-{slot['id']}"
        def sample(kind):
            return rgb(prefix.with_name(prefix.name + f"-{kind}.png")) - base

        response = sample("white")
        ys, xs = np.where(response.max(axis=2) > 1)
        if not len(xs) or response.min() < -3:
            raise ValueError(f"Unsupported response: {model}/{slot['id']}")
        left, top, right, bottom = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        crop = np.s_[top:bottom, left:right]
        tones = np.stack([sample(k)[crop] for k in ("low", "mid", "high")] + [response[crop]], axis=2)
        tones = np.maximum.accumulate(tones.clip(0, 255), axis=2)
        gray = tones.mean(axis=3)
        bounds = (0, 64, 128, 192, 255)
        def invert(kind):
            observed = sample(kind)[crop].mean(axis=2)
            value = np.zeros_like(observed)
            previous = np.zeros_like(observed)
            for index, (start, end) in enumerate(zip(bounds, bounds[1:])):
                current = gray[:, :, index]
                value += np.clip((observed - previous) / np.maximum(current - previous, 1), 0, 1) * (end - start)
                previous = current
            return value / 255

        coordinates = []
        for axis in ("x", "y"):
            coarse = invert(axis)
            sine = invert(axis + "sin") - 0.5
            cosine = invert(axis + "cos") - 0.5
            phase = np.arctan2(sine, cosine) / (2 * np.pi)
            refined = (phase + np.rint(coarse * 6 - phase)) / 6
            reliable = np.hypot(sine, cosine) > 0.25
            coordinates.append(np.clip(np.where(reliable, refined, coarse), 0, 1) * 65535)
        uv = np.rint(np.stack(coordinates, axis=2)).astype("<u2")
        maps = np.empty((*tones.shape[:2], 16), dtype=np.uint8)
        maps[:, :, :4] = uv.view(np.uint8)
        maps[:, :, 4:] = tones.reshape(*tones.shape[:2], 12)
        filename = slot["id"] + ".gz"
        (target / filename).write_bytes(gzip.compress(maps.tobytes(), compresslevel=9, mtime=0))
        labels = {"left": "Esquerda", "center": "Centro", "right": "Direita",
                  "label": "Faixa superior", "sheet": "Papéis sobrepostos"}
        front_back = {"caneca-frente": "Frente", "caneca-fundo": "Verso"}
        instance = {"instance": {"id": slot["id"], "label": front_back[slot["id"]] if model == "3" else labels[slot["role"]]}}
        if slot["type"] != "mug":
            instance["framing"] = "original"
        manifest["slots"].append({
            "file": filename, "left": left, "top": top, "width": right-left, "height": bottom-top,
            "input": slot["expectedSize"], "placement": slot["defaultPlacement"],
            **instance,
        })
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(model, manifest["width"], manifest["height"], round(sum(f.stat().st_size for f in target.iterdir()) / (1024 ** 2), 1), "MiB")
