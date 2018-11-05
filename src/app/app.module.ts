import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgAbilityModule, AbilityFor, Ability } from 'ng-ability';

export class User {
  id: string;
  admin: boolean;
}

@AbilityFor(User, 'User')
export class UserAbility implements Ability<User, User> {
  can(currentUser: User | null, action: string, user: User) {
    if (currentUser != null && currentUser.admin) {
      return true;
    }

    switch (action) {
      case 'create':
        return true;
      case 'edit':
        return currentUser != null && currentUser.id === user.id;
      default:
        return false;
    }
  }
}

export class UserAbilityContext {
  private currentUser: User;

  getAbilityContext(): User {
    return this.currentUser || (this.currentUser = new User());
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgAbilityModule.withAbilities(UserAbilityContext, [UserAbility])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
