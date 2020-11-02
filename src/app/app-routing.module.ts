import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConcordFormComponent } from './components/concord-form/concord-form.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { LinesDisplayComponent } from './components/lines-display/lines-display.component';

const routes: Routes = [
  {path:'', component: ConcordFormComponent},
  {path:'home', component: ConcordFormComponent},
  {path:'lines', component: LinesDisplayComponent},
  {path:'**', component: NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
