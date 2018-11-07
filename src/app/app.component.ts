import { Component, OnInit } from '@angular/core';
import { NgAbilityService } from 'ng-ability';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ng-ability-app';

  constructor(private readonly ability: NgAbilityService) {}

  ngOnInit() {
    console.log(this.ability.can('edit', 'User'));
  }
}
