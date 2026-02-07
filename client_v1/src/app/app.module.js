import angular from "angular";
import "angular-route";
import "angular-animate";
import "angular-aria";
import "angular-material";
import "angular-messages";

import "./features/login/index";

angular.module("app", ["ngRoute", "ngMaterial", "app.login", "ngMessages"]);
