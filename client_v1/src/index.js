import angular from "angular";
import "angular-route";
import "angular-material/angular-material.css";
import "./styles/colors.css";
import "./styles/global.css";

import "./app/index";

angular.element(document).ready(() => {
  angular.bootstrap(document, ["app"]);
});
