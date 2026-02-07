import template from "./layout.component.html";

import "./header/header.component";
import "./navigation/navigation.component";

class LayoutComponent {
  constructor() {}
}

LayoutComponent.$inject = [];

angular
  .module("app.layout", ["app.header", "app.navigation"])
  .component("layout", {
    template: template,
    controller: LayoutComponent,
  });
