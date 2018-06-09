(function () {
   'use strict';
   var myApp = angular.module('app');
   myApp.controller('FileUploadController', function ($scope) {

       $scope.uploadFile = function () {
           var fileList = $scope.myFile;

           // Check for the various File API support.
           if (window.File && window.FileReader && window.FileList && window.Blob) {
             // Great success! All the File APIs are supported.
           } else {
             alert('The File APIs are not fully supported in this browser.');
           }

           for (var i = 0, len = fileList.length; i < len; i++) {
             readAndConvertFile(fileList[i]);
           }
       };
   });

   function readAndConvertFile(file) {
     //console.log(file);
     var textType = /text.*/;
     if (file.type.match(textType)) {
       var reader = new FileReader();

       reader.onload = function(e) {
         console.log(reader.result);
       };

       reader.readAsText(file);

     } else {
       console.log("File not supported!");
     }
   }

})();
