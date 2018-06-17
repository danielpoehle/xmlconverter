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
         convertText(reader.result);

       };

       reader.readAsText(file, 'ISO-8859-1');

     } else {
       console.log("File not supported!");
     }
   }

   function convertText(text) {
     let lines = text.split('\n');
     //console.log(lines.length);
     //
     //check if file structure is correct
     let l1 = 'Btrst.;Btrst.(lang);Halt mind.;Ankunft;ZuHalt;Halt;ZuHalt;Abfahrt;ZLB;Endpunkt;Zuschlag Schlepp.;Zuschlag;Bauzuschlag;Fahrweg';

     let l2 = 'Trasse;Zuggattung;TFZ - Standard;TFZ - Abschnittswirkend;Wagen;Wagenzuglänge;Gesamtlänge;Wagenzugmasse;Grenzlast;Gesamtmasse;V Wagenzug;V Konstruktion;Max. V;LZB-fähig;ETCS-Zugausrüstung;Bremsstellung;Bremshundertstel;Neigetechnik;LÜ-Charakteristik;LÜ-Abschnitt;LÜ-Text;Bef.Bes.;Sperrfahrt;Abweich. HV-Vmax;Anteil Regelzuschlag;CLuft;CLager;Verkehrt;Zugkl.;Rel. Halteplatzart;Kommentar';

     if (l2.trim() !== lines[4].trim()) {
       console.log("File does not meet the expected structure - line 5");
       console.log(lines[4].trim());
       return;
     }

     if (l1.trim() !== lines[7].trim()) {
       console.log("File does not meet the expected structure - line 8");
       console.log(lines[7].trim());
       return;
     }


     // generate the different parts of the file

     let firstPart = '<?xml version="1.0" encoding="iso-8859-1"?>\n<Zugtrassen>\n\t<Zugtrasse>\n\t\t<Zugnummer></Zugnummer>\n';
     let lastPart = '\t</Zugtrasse>\n</Zugtrassen>';
     let aenderung = getAenderung(lines[2]);
     let zugch = getZCH(lines[5]);
     let bemerkung = getBemerkung(lines[2]);
     let laufpunkte = getLaufpunkte(lines.slice(9));

     let completeXML = firstPart + aenderung + zugch + bemerkung + laufpunkte + lastPart;
     download("test.xml", completeXML);
   }

   function getLaufpunkte(laufpunkte){
     let lp = "\t\t<Zugfahrtpunkte>\n";

     for (let i = 0, len = laufpunkte.length; i < len; i++) {
       let laufpunkt = laufpunkte[i].split(";");
       console.log(laufpunkt);


       if(laufpunkt.length === 14){
         let ankunftszeit = laufpunkt[3].trim(),
             abfahrtszeit = laufpunkt[7].trim(),
             mindesthaltezeit = laufpunkt[2].trim();
         if(ankunftszeit === ""){
           if(abfahrtszeit !== ""){
             lp += getDurchfahrt(laufpunkt);
           }
         }else {
           if(mindesthaltezeit !== ""){
             lp += getHalt(laufpunkt);
           }else{
             lp += getBedarfshalt(laufpunkt);
           }
         }
       }
     }

     lp += "\t\t</Zugfahrtpunkte>\n";
     return lp;
   }

   function getDurchfahrt(laufpunkt){
     let d = "\t\t\t<Durchfahrt>\n" + parseDS100(laufpunkt);
     d += "\t\t\t\t<Durchfahrtzeit>" + modifyTimestamp(laufpunkt[7]) + "</Durchfahrtzeit>\n";
     d += parseZuschlag(laufpunkt);
     d += parseBauzuschlag(laufpunkt);
     d += parseZusatzhalt(laufpunkt);
     d += parseStrecke(laufpunkt);
     d += "\t\t\t</Durchfahrt>\n";
     return d;
   }

   function getHalt(laufpunkt){
     let h = "\t\t\t<Verkehrshalt>\n" + parseDS100(laufpunkt);

     h += "\t\t\t\t<Ankunftszeit>" + modifyTimestamp(laufpunkt[3]) + "</Ankunftszeit>\n" +
          "\t\t\t\t<Abfahrtszeit>" + modifyTimestamp(laufpunkt[7]) + "</Abfahrtszeit>\n" +
          "\t\t\t\t<Mindesthaltedauer>" + laufpunkt[2].trim() +  "</Mindesthaltedauer>\n\t\t\t\t<Haltart>H</Haltart>\n";
     h += parseZuschlag(laufpunkt);
     h += parseBauzuschlag(laufpunkt);
     h += parseStrecke(laufpunkt);
     h += "\t\t\t</Verkehrshalt>\n";
     return h;
   }

   function getBedarfshalt(laufpunkt){
     let b = "\t\t\t<Verkehrshalt>\n" + parseDS100(laufpunkt);

     b += "\t\t\t\t<Ankunftszeit>" + modifyTimestamp(laufpunkt[3]) + "</Ankunftszeit>\n" +
          "\t\t\t\t<Abfahrtszeit>" + modifyTimestamp(laufpunkt[7]) + "</Abfahrtszeit>\n" + "\t\t\t\t<Haltart>+TM</Haltart>\n";
     b += parseZuschlag(laufpunkt);
     b += parseBauzuschlag(laufpunkt);
     b += parseStrecke(laufpunkt);
     b += "\t\t\t</Verkehrshalt>\n";
     return b;
   }

   function parseZuschlag(laufpunkt){
     if(laufpunkt[11].includes("/")){
       return("\t\t\t\t<Zuschlag>" + laufpunkt[11].split("/")[0].trim() + "</Zuschlag>\n");
     }
     return "";
   }

   function parseZusatzhalt(laufpunkt){
     let zusatz = laufpunkt[4].replace('(','').replace(')', '').replace('Z','').trim();
     if(zusatz !== ""){
       return("\t\t\t\t<Zusatzhalt>" + zusatz + "</Zusatzhalt>\n");
     }
     return "";
   }

   function parseStrecke(laufpunkt){
     if(laufpunkt[9].split("-")[0].trim() !== ""){
       return("\t\t\t\t<Strecke>" + laufpunkt[9].split("-")[0].trim() + "</Strecke>\n" + "\t\t\t\t<Streckengleis>" + laufpunkt[9].split("-")[1].trim() + "</Streckengleis>\n");
     }
     return "";
   }

   function parseDS100(laufpunkt){
     return("\t\t\t\t<DS100>" + laufpunkt[0].trim() + "</DS100>\n");
   }

   function parseBauzuschlag(laufpunkt){
     if(laufpunkt[12].replace('[','').replace(']', '').trim() !== ""){
       return("\t\t\t\t<Bauzuschlag>" + laufpunkt[12].replace('[','').replace(']', '').trim() + "</Bauzuschlag>\n");
     }
     return "";
   }

   function modifyTimestamp(time){
     let timestamp = time.replace('(','').replace(')', '').trim();
     if(timestamp.includes("/")){
       timestamp = timestamp.split("/")[1];
     }
     return timestamp;
   }

   function getBemerkung(line){
     let bem = "\t\t<Bemerkung>" + line.trim() + "</Bemerkung>\n";
     return bem;
   }

   function getZCH(line) {
     let infos = line.split(";");
     //console.log(infos);
     let zch = "\t\t<Zugcharakteristik>\n" +
               "\t\t\t<Zuggattung>" + infos[1].trim() + "</Zuggattung>\n" +
               "\t\t\t<Tfz>" + infos[2].trim() + "</Tfz>\n" +
               "\t\t\t<Wagenanzahl>" + infos[4].trim() + "</Wagenanzahl>\n" +
               "\t\t\t<Wagenzuglänge>" + infos[5].trim() + "</Wagenzuglänge>\n" +
               "\t\t\t<Wagenzugmasse>" + infos[7].trim() + "</Wagenzugmasse>\n" +
               "\t\t\t<Gesamtmasse>" + infos[9].trim() + "</Gesamtmasse>\n" +
               "\t\t\t<Konstruktionsgeschwindigkeit>" + infos[11].trim() + "</Konstruktionsgeschwindigkeit>\n" +
               "\t\t\t<Hoechstgeschwindigkeit>" + infos[12].trim() + "</Hoechstgeschwindigkeit>\n" +
               "\t\t\t<LZB>" + infos[13].trim() + "</LZB>\n" +
               "\t\t\t<ETCS>" + infos[14].trim() + "</ETCS>\n" +
               "\t\t\t<Bremsstellung>" + infos[15].trim() + "</Bremsstellung>\n" +
               "\t\t\t<Bremshundertstel>" + infos[16].trim() + "</Bremshundertstel>\n" +
               "\t\t\t<Neigetechnik>" + infos[17].trim() + "</Neigetechnik>\n" +
               "\t\t\t<Verkehrszeitraum>" + infos[27].trim() + "</Verkehrszeitraum>\n" +
               "\t\t\t<Zugklasse>" + infos[28].trim() + "</Zugklasse>\n" +
               "\t\t\t<Kommentar>" + infos[30].trim() + "</Kommentar>\n" +
               "\t\t</Zugcharakteristik>\n";
     return zch;
   }

   function getAenderung(line){
     //console.log(line);
     let s_index = line.lastIndexOf("Letzte Änd. ");
     let ae_date = line.slice(s_index+12, s_index+28) + ":00";
     ae_date = '\t\t<LetzteAenderung>' + ae_date + '</LetzteAenderung>\n';

     return ae_date;
   }

   function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=iso-8859-1,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

})();
