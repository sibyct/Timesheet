import template from "./register.component.html";
import "./resister.component.css";

class RegisterController {
  constructor() {
    this.user = {};
    this.error = "";
  }

  submit(form) {
    // Stop if form is invalid
    if (form.$invalid) {
      return;
    }
  }
}

angular.module("app.login").component("register", {
  template: template,
  controller: RegisterController,
});
