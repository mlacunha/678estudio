/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    studioSettings?: Promise<import('./db/studioSettings').StudioSettings>;
  }
}
