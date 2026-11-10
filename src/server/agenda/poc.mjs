import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { classicLayouts, compileClassicAgenda, isClassicAgendaConfig } from './classic.mjs';

const [yearArg = '2027', directory = 'output/pdf/agenda-classica'] = process.argv.slice(2);
const year = Number(yearArg);
if (!/^\d{4}$/.test(yearArg) || !isClassicAgendaConfig(classicLayouts[0], year)) {
  throw new RangeError('Informe um ano entre 1900 e 9998.');
}

const parent = resolve(directory);
await mkdir(parent, { recursive: true });
const output = await mkdtemp(join(parent, `${year}-`));
console.log(`Saída: ${output}`);
for (const layout of classicLayouts) {
  const config = { layout, year };
  const name = `agenda-classica-${layout}`;
  const pdf = await compileClassicAgenda(config);
  await writeFile(join(output, `${name}.pdf`), pdf);
  await compileClassicAgenda(config, {
    pages: [1, 2],
    output: join(output, `${name}-pagina-{p}.png`),
  });
  console.log(`${layout}: PDF e duas prévias gerados`);
}
