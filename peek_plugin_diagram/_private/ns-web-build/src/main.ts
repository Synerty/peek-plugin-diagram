import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { NsWebDiagramModule } from './diagram-component/ns-web-diagram.module';
import { environment } from './environments/environment';

import { VortexService } from "@synerty/vortexjs";
VortexService.setVortexUrl(null);
VortexService.setVortexClientName("diagram webview - should not connect");


if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(NsWebDiagramModule);
