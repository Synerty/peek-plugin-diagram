import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import {VortexService} from "@synerty/vortexjs";
VortexService.setVortexClientName("peek-mobile-ns-diagram");

import { NsWebDiagramModule } from './diagram-component/ns-web-diagram.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(NsWebDiagramModule);
