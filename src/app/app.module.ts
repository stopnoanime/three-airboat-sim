import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { HudComponent } from './hud/hud.component';
import { LoadingScreenComponent } from './loading-screen/loading-screen.component';
import { PauseScreenComponent } from './pause-screen/pause-screen.component';

@NgModule({
  declarations: [
    AppComponent,
    HudComponent,
    LoadingScreenComponent,
    PauseScreenComponent,
  ],
  imports: [BrowserModule, BrowserAnimationsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
