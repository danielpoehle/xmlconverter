(function () {
   'use strict';
   var myApp = angular.module('app');
   myApp.controller('FileUploadController', function ($scope) {

       $scope.uploadFile = function () {
           var file = $scope.myFile;
           console.log(file);
       };
   });

})();
