/* Get Shaped – NUR NUR NATUR (ALDI SÜD): Nährwerte pro 100 g/ml nach den Produktseiten auf aldi-sued.de (abgerufen am 23.10.2026).
   Offensichtliche Fehler auf den Seiten wurden nicht übernommen oder korrigiert (siehe Feld x). Eintrag wird einmalig in den eigenen Katalog übernommen. */
(() => {
'use strict';
const FLAG='get_shaped_nnn_v1',BASE='https://www.aldi-sued.de/produkt/';
// n=Name, a=Aliase, k=kcal, p=Eiweiß, c=Kohlenhydrate, f=Fett, b=Ballaststoffe, u=Einheit, s=Produktseite, x=Hinweis
const ITEMS=[
{
"n": "Dinkel-Spaghetti (NUR NUR NATUR)",
"a": [
"Dinkel-Spaghetti",
"nur nur natur Dinkel-Spaghetti",
"NNN Dinkel-Spaghetti"
],
"k": 360,
"p": 11.0,
"c": 74.0,
"f": 1.5,
"b": 3.3,
"u": "g",
"s": "nur-nur-natur-bio-dinkel-spaghetti-500-g-000000000000486241"
},
{
"n": "Vollmilch 3,8 % (NUR NUR NATUR)",
"a": [
"Vollmilch 3,8 %",
"nur nur natur Vollmilch 3,8 %",
"NNN Vollmilch 3,8 %"
],
"k": 72,
"p": 3.5,
"c": 5.0,
"f": 4.3,
"b": null,
"u": "ml",
"s": "nur-nur-natur-frische-bio-vollmilch-3-8-1-l-000000000000493388"
},
{
"n": "Vollkorn Basmatireis (NUR NUR NATUR)",
"a": [
"Vollkorn Basmatireis",
"nur nur natur Vollkorn Basmatireis",
"NNN Vollkorn Basmatireis"
],
"k": 356,
"p": 8.7,
"c": 72.2,
"f": 3.2,
"b": 1.9,
"u": "g",
"s": "nur-nur-natur-bio-vollkorn-basmatireis-500-g-000000000000494015"
},
{
"n": "Wiener Würstchen (NUR NUR NATUR)",
"a": [
"Wiener Würstchen",
"nur nur natur Wiener Würstchen",
"NNN Wiener Würstchen"
],
"k": 282,
"p": 14.0,
"c": 0.0,
"f": 25.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-wiener-wuerstchen-200-g-000000000000498393"
},
{
"n": "Salami (NUR NUR NATUR)",
"a": [
"Salami",
"nur nur natur Salami",
"NNN Salami"
],
"k": 382,
"p": 22.5,
"c": 1.0,
"f": 32.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-salami-80-g-000000000000521282"
},
{
"n": "Leinöl (NUR NUR NATUR)",
"a": [
"Leinöl",
"nur nur natur Leinöl",
"NNN Leinöl"
],
"k": 837,
"p": 0.0,
"c": 0.0,
"f": 93.0,
"b": null,
"u": "ml",
"s": "nur-nur-natur-bio-leinoel-250-ml-000000000000569181"
},
{
"n": "Nürnberger Rostbratwurst (NUR NUR NATUR)",
"a": [
"Nürnberger Rostbratwurst",
"nur nur natur Nürnberger Rostbratwurst",
"NNN Nürnberger Rostbratwurst"
],
"k": 348,
"p": 14.0,
"c": 1.0,
"f": 32.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-nuernberger-rostbratwurst-250-g-000000000000589150"
},
{
"n": "Naturjoghurt 3,8 % Fett (NUR NUR NATUR)",
"a": [
"Naturjoghurt 3,8 % Fett",
"nur nur natur Naturjoghurt 3,8 % Fett",
"NNN Naturjoghurt 3,8 % Fett"
],
"k": 69,
"p": 5.0,
"c": 3.7,
"f": 3.8,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-naturjoghurt-3-8-fett-400-g-000000000000591941"
},
{
"n": "Landhähnchen Ministeaks (NUR NUR NATUR)",
"a": [
"Landhähnchen Ministeaks",
"nur nur natur Landhähnchen Ministeaks",
"NNN Landhähnchen Ministeaks"
],
"k": 102,
"p": 24.0,
"c": 0.0,
"f": 0.7,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-landhaehnchen-ministeaks-350-g-000000000000598588"
},
{
"n": "Walnusskerne (NUR NUR NATUR)",
"a": [
"Walnusskerne",
"nur nur natur Walnusskerne",
"NNN Walnusskerne"
],
"k": 717,
"p": 16.0,
"c": 4.8,
"f": 69.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-walnusskerne-200-g-000000000000629916"
},
{
"n": "Heumilch-Käsescheiben Emmentaler (NUR NUR NATUR)",
"a": [
"Heumilch-Käsescheiben Emmentaler",
"nur nur natur Heumilch-Käsescheiben Emmentaler",
"NNN Heumilch-Käsescheiben Emmentaler"
],
"k": 395,
"p": 29.0,
"c": 0.0,
"f": 31.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-heumilch-kaesescheiben-150-g-emmentaler-000000000487869001"
},
{
"n": "Heumilch-Käsescheiben Bergkäse (NUR NUR NATUR)",
"a": [
"Heumilch-Käsescheiben Bergkäse",
"nur nur natur Heumilch-Käsescheiben Bergkäse",
"NNN Heumilch-Käsescheiben Bergkäse"
],
"k": 418,
"p": 28.0,
"c": 0.0,
"f": 34.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-heumilch-kaesescheiben-150-g-bergkaese-000000000487869002"
},
{
"n": "Hafervollkorn-Riegel Schoko (NUR NUR NATUR)",
"a": [
"Hafervollkorn-Riegel Schoko",
"nur nur natur Hafervollkorn-Riegel Schoko",
"NNN Hafervollkorn-Riegel Schoko"
],
"k": 421,
"p": 9.9,
"c": 59.0,
"f": 15.0,
"b": 7.5,
"u": "g",
"s": "nur-nur-natur-bio-hafervollkorn-riegel-105-g-schoko-000000000505490001"
},
{
"n": "Hafervollkorn-Riegel Saaten (NUR NUR NATUR)",
"a": [
"Hafervollkorn-Riegel Saaten",
"nur nur natur Hafervollkorn-Riegel Saaten",
"NNN Hafervollkorn-Riegel Saaten"
],
"k": 430,
"p": 11.0,
"c": 58.0,
"f": 16.0,
"b": 5.9,
"u": "g",
"s": "nur-nur-natur-bio-hafervollkorn-riegel-105-g-saaten-000000000505490002"
},
{
"n": "Hafervollkorn-Riegel Kokos (NUR NUR NATUR)",
"a": [
"Hafervollkorn-Riegel Kokos",
"nur nur natur Hafervollkorn-Riegel Kokos",
"NNN Hafervollkorn-Riegel Kokos"
],
"k": 438,
"p": 8.5,
"c": 59.0,
"f": 17.0,
"b": 6.7,
"u": "g",
"s": "nur-nur-natur-bio-hafervollkorn-riegel-105-g-kokos-000000000505490003"
},
{
"n": "Hafertaler Pur (NUR NUR NATUR)",
"a": [
"Hafertaler Pur",
"nur nur natur Hafertaler Pur",
"NNN Hafertaler Pur"
],
"k": 483,
"p": 8.8,
"c": 59.7,
"f": 22.0,
"b": 5.6,
"u": "g",
"s": "nur-nur-natur-bio-hafertaler-150-g-pur-000000000520356003"
},
{
"n": "Hafertaler Cashew (NUR NUR NATUR)",
"a": [
"Hafertaler Cashew",
"nur nur natur Hafertaler Cashew",
"NNN Hafertaler Cashew"
],
"k": 491,
"p": 10.1,
"c": 57.2,
"f": 23.4,
"b": 5.4,
"u": "g",
"s": "nur-nur-natur-bio-hafertaler-150-g-cashew-000000000520356001"
},
{
"n": "Fruchtmus Apfel-Aprikose (NUR NUR NATUR)",
"a": [
"Fruchtmus Apfel-Aprikose",
"nur nur natur Fruchtmus Apfel-Aprikose",
"NNN Fruchtmus Apfel-Aprikose"
],
"k": 56,
"p": 0.0,
"c": 12.0,
"f": 0.0,
"b": 1.7,
"u": "g",
"s": "nur-nur-natur-bio-fruchtmus-360-g-apfel-aprikose-000000000534958002"
},
{
"n": "Fruchtmus Apfel-Banane (NUR NUR NATUR)",
"a": [
"Fruchtmus Apfel-Banane",
"nur nur natur Fruchtmus Apfel-Banane",
"NNN Fruchtmus Apfel-Banane"
],
"k": 68,
"p": 0.0,
"c": 14.0,
"f": 0.0,
"b": 1.9,
"u": "g",
"s": "nur-nur-natur-bio-fruchtmus-360-g-apfel-banane-000000000534958003"
},
{
"n": "Fruchtmus Apfel-Mango (NUR NUR NATUR)",
"a": [
"Fruchtmus Apfel-Mango",
"nur nur natur Fruchtmus Apfel-Mango",
"NNN Fruchtmus Apfel-Mango"
],
"k": 60,
"p": 0.4,
"c": 12.4,
"f": 0.4,
"b": 1.8,
"u": "g",
"s": "nur-nur-natur-bio-fruchtmus-360-g-apfel-mango-000000000534958005"
},
{
"n": "Kimchi Mild (NUR NUR NATUR)",
"a": [
"Kimchi Mild",
"nur nur natur Kimchi Mild",
"NNN Kimchi Mild"
],
"k": 26,
"p": 1.2,
"c": 5.1,
"f": 0.1,
"b": 3.2,
"u": "g",
"s": "nur-nur-natur-bio-kimchi-240-g-mild-000000000536728001"
},
{
"n": "Kimchi Original (NUR NUR NATUR)",
"a": [
"Kimchi Original",
"nur nur natur Kimchi Original",
"NNN Kimchi Original"
],
"k": 34,
"p": 1.8,
"c": 6.0,
"f": 0.3,
"b": 4.1,
"u": "g",
"s": "nur-nur-natur-bio-kimchi-240-g-original-000000000536728002"
},
{
"n": "Tomatensauce Basilikum (NUR NUR NATUR)",
"a": [
"Tomatensauce Basilikum",
"nur nur natur Tomatensauce Basilikum",
"NNN Tomatensauce Basilikum"
],
"k": 60,
"p": 1.9,
"c": 6.6,
"f": 2.6,
"b": 1.1,
"u": "ml",
"s": "nur-nur-natur-bio-tomatensauce-325-ml-basilikum-000000000573047001"
},
{
"n": "Tomatensauce Arrabiata (NUR NUR NATUR)",
"a": [
"Tomatensauce Arrabiata",
"nur nur natur Tomatensauce Arrabiata",
"NNN Tomatensauce Arrabiata"
],
"k": 58,
"p": 1.9,
"c": 6.9,
"f": 2.3,
"b": 1.2,
"u": "ml",
"s": "nur-nur-natur-bio-tomatensauce-325-ml-arrabiata-000000000573047002"
},
{
"n": "Tomatensauce Gemüse Parmesan (NUR NUR NATUR)",
"a": [
"Tomatensauce Gemüse Parmesan",
"nur nur natur Tomatensauce Gemüse Parmesan",
"NNN Tomatensauce Gemüse Parmesan"
],
"k": 76,
"p": 3.1,
"c": 8.0,
"f": 3.1,
"b": 1.6,
"u": "ml",
"s": "nur-nur-natur-bio-tomatensauce-325-ml-gemuese-parmesan-000000000573047003"
},
{
"n": "Quark Magerstufe (NUR NUR NATUR)",
"a": [
"Quark Magerstufe",
"nur nur natur Quark Magerstufe",
"NNN Quark Magerstufe"
],
"k": 70,
"p": 12.2,
"c": 3.9,
"f": 0.3,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-quark-250-g-magerstufe-000000000583624001"
},
{
"n": "Quark 20 % (NUR NUR NATUR)",
"a": [
"Quark 20 %",
"nur nur natur Quark 20 %",
"NNN Quark 20 %"
],
"k": 100,
"p": 11.0,
"c": 3.6,
"f": 4.4,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-quark-250-g-20-000000000583624002"
},
{
"n": "Pesto Genovese (NUR NUR NATUR)",
"a": [
"Pesto Genovese",
"nur nur natur Pesto Genovese",
"NNN Pesto Genovese"
],
"k": 298,
"p": 3.9,
"c": 4.8,
"f": 29.0,
"b": 1.3,
"u": "g",
"s": "nur-nur-natur-bio-pesto-130-g-genovese-000000000586749001"
},
{
"n": "Pesto Rosso (NUR NUR NATUR)",
"a": [
"Pesto Rosso",
"nur nur natur Pesto Rosso",
"NNN Pesto Rosso"
],
"k": 419,
"p": 5.8,
"c": 13.8,
"f": 37.0,
"b": 3.8,
"u": "g",
"s": "nur-nur-natur-bio-pesto-130-g-rosso-000000000586749002"
},
{
"n": "Apfelrotkohl (NUR NUR NATUR)",
"a": [
"Apfelrotkohl",
"nur nur natur Apfelrotkohl",
"NNN Apfelrotkohl"
],
"k": 60,
"p": 0.9,
"c": 12.0,
"f": 0.5,
"b": 2.7,
"u": "g",
"s": "nur-nur-natur-bio-apfelrotkohl-520-g-000000000586762001"
},
{
"n": "Sauerkraut (NUR NUR NATUR)",
"a": [
"Sauerkraut",
"nur nur natur Sauerkraut",
"NNN Sauerkraut"
],
"k": 27,
"p": 1.4,
"c": 2.7,
"f": 0.5,
"b": 2.7,
"u": "g",
"s": "nur-nur-natur-bio-sauerkraut-520-g-000000000586762002",
"x": "kcal-Angabe der Seite (2.7) passt nicht zu 112.0 kJ → 27 kcal"
},
{
"n": "Shot Ingwer-Mango-Passionsfrucht (NUR NUR NATUR)",
"a": [
"Shot Ingwer-Mango-Passionsfrucht",
"nur nur natur Shot Ingwer-Mango-Passionsfrucht",
"NNN Shot Ingwer-Mango-Passionsfrucht"
],
"k": 47,
"p": 0.4,
"c": 10.1,
"f": 0.1,
"b": 0.4,
"u": "ml",
"s": "nur-nur-natur-bio-shot-95-ml-ingwer-mango-passionsfrucht-000000000589181003"
},
{
"n": "Shot Ingwer-Heidelbeere-Brombeere (NUR NUR NATUR)",
"a": [
"Shot Ingwer-Heidelbeere-Brombeere",
"nur nur natur Shot Ingwer-Heidelbeere-Brombeere",
"NNN Shot Ingwer-Heidelbeere-Brombeere"
],
"k": 45,
"p": 0.4,
"c": 9.1,
"f": 0.2,
"b": 1.2,
"u": "ml",
"s": "nur-nur-natur-bio-shot-95-ml-ingwer-heidelbeere-brombeere-000000000589181004"
},
{
"n": "Reibekäse Gratinkäse (NUR NUR NATUR)",
"a": [
"Reibekäse Gratinkäse",
"nur nur natur Reibekäse Gratinkäse",
"NNN Reibekäse Gratinkäse"
],
"k": 413,
"p": 29.0,
"c": 0.1,
"f": 33.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-reibekaese-150-g-gratinkaese-000000000589737001"
},
{
"n": "Reibekäse Emmentaler (NUR NUR NATUR)",
"a": [
"Reibekäse Emmentaler",
"nur nur natur Reibekäse Emmentaler",
"NNN Reibekäse Emmentaler"
],
"k": 386,
"p": 29.0,
"c": 0.1,
"f": 30.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-reibekaese-150-g-emmentaler-000000000589737002"
},
{
"n": "Fruchtaufstrich Erdbeere (NUR NUR NATUR)",
"a": [
"Fruchtaufstrich Erdbeere",
"nur nur natur Fruchtaufstrich Erdbeere",
"NNN Fruchtaufstrich Erdbeere"
],
"k": 156,
"p": 0.9,
"c": 35.0,
"f": 0.5,
"b": 2.1,
"u": "g",
"s": "nur-nur-natur-bio-fruchtaufstrich-250-g-erdbeere-000000000590068001"
},
{
"n": "Fruchtaufstrich Himbeere (NUR NUR NATUR)",
"a": [
"Fruchtaufstrich Himbeere",
"nur nur natur Fruchtaufstrich Himbeere",
"NNN Fruchtaufstrich Himbeere"
],
"k": 157,
"p": 1.2,
"c": 33.0,
"f": 0.2,
"b": 4.3,
"u": "g",
"s": "nur-nur-natur-bio-fruchtaufstrich-250-g-himbeere-000000000590068002"
},
{
"n": "Hülsenfrüchte Gartenerbse (NUR NUR NATUR)",
"a": [
"Hülsenfrüchte Gartenerbse",
"nur nur natur Hülsenfrüchte Gartenerbse",
"NNN Hülsenfrüchte Gartenerbse"
],
"k": 64,
"p": 5.4,
"c": 5.6,
"f": 0.7,
"b": 6.7,
"u": "g",
"s": "nur-nur-natur-bio-huelsenfruechte-230-g-gartenerbse-000000000590211003"
},
{
"n": "Hülsenfrüchte Belugalinse (NUR NUR NATUR)",
"a": [
"Hülsenfrüchte Belugalinse",
"nur nur natur Hülsenfrüchte Belugalinse",
"NNN Hülsenfrüchte Belugalinse"
],
"k": 83,
"p": 7.0,
"c": 11.0,
"f": 0.5,
"b": 3.0,
"u": "g",
"s": "nur-nur-natur-bio-huelsenfruechte-220-g-belugalinse-000000000590211004"
},
{
"n": "Tempeh Curry (NUR NUR NATUR)",
"a": [
"Tempeh Curry",
"nur nur natur Tempeh Curry",
"NNN Tempeh Curry"
],
"k": 168,
"p": 15.2,
"c": 2.6,
"f": 9.4,
"b": 6.3,
"u": "g",
"s": "nur-nur-natur-bio-tempeh-200-g-curry-000000000591777002"
},
{
"n": "Tempeh Natur (NUR NUR NATUR)",
"a": [
"Tempeh Natur",
"nur nur natur Tempeh Natur",
"NNN Tempeh Natur"
],
"k": 180,
"p": 18.1,
"c": 1.3,
"f": 9.7,
"b": 7.8,
"u": "g",
"s": "nur-nur-natur-bio-tempeh-200-g-natur-000000000591777001"
},
{
"n": "Joghurt mild Mango (NUR NUR NATUR)",
"a": [
"Joghurt mild Mango",
"nur nur natur Joghurt mild Mango",
"NNN Joghurt mild Mango"
],
"k": 85,
"p": 4.1,
"c": 10.1,
"f": 3.1,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-joghurt-mild-250-g-mango-000000000591940001"
},
{
"n": "Joghurt mild Beerenmix (NUR NUR NATUR)",
"a": [
"Joghurt mild Beerenmix",
"nur nur natur Joghurt mild Beerenmix",
"NNN Joghurt mild Beerenmix"
],
"k": 84,
"p": 4.1,
"c": 10.0,
"f": 3.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-joghurt-mild-250-g-beerenmix-000000000591940002"
},
{
"n": "Joghurt mild Pfirsich-Maracuja (NUR NUR NATUR)",
"a": [
"Joghurt mild Pfirsich-Maracuja",
"nur nur natur Joghurt mild Pfirsich-Maracuja",
"NNN Joghurt mild Pfirsich-Maracuja"
],
"k": 84,
"p": 4.1,
"c": 9.9,
"f": 3.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-joghurt-mild-250-g-pfirsich-maracuja-000000000591940003"
},
{
"n": "Suppe Tomatensuppe (NUR NUR NATUR)",
"a": [
"Suppe Tomatensuppe",
"nur nur natur Suppe Tomatensuppe",
"NNN Suppe Tomatensuppe"
],
"k": 35,
"p": 1.2,
"c": 4.5,
"f": 1.1,
"b": 1.0,
"u": "ml",
"s": "nur-nur-natur-bio-suppe-375-ml-tomatensuppe-000000000587762001"
},
{
"n": "Suppe Karotte-Ingwer (NUR NUR NATUR)",
"a": [
"Suppe Karotte-Ingwer",
"nur nur natur Suppe Karotte-Ingwer",
"NNN Suppe Karotte-Ingwer"
],
"k": 50,
"p": 1.5,
"c": 6.8,
"f": 1.4,
"b": 2.0,
"u": "ml",
"s": "nur-nur-natur-bio-suppe-375-ml-karotte-ingwer-000000000587762003"
},
{
"n": "Suppen Brokkoli (NUR NUR NATUR)",
"a": [
"Suppen Brokkoli",
"nur nur natur Suppen Brokkoli",
"NNN Suppen Brokkoli"
],
"k": 40,
"p": 1.5,
"c": 4.5,
"f": 1.5,
"b": 1.3,
"u": "ml",
"s": "nur-nur-natur-bio-suppen-375-ml-brokkoli-000000000587762004"
},
{
"n": "Orangensaft (NUR NUR NATUR)",
"a": [
"Orangensaft",
"nur nur natur Orangensaft",
"NNN Orangensaft"
],
"k": 46,
"p": 0.7,
"c": 9.2,
"f": 0.2,
"b": null,
"u": "ml",
"s": "nur-nur-natur-bio-orangensaft-0-75-l-000000000000603836"
},
{
"n": "Pure Bite Cashew (NUR NUR NATUR)",
"a": [
"Pure Bite Cashew",
"nur nur natur Pure Bite Cashew",
"NNN Pure Bite Cashew"
],
"k": 468,
"p": 10.2,
"c": 51.4,
"f": 23.1,
"b": 6.8,
"u": "g",
"s": "nur-nur-natur-bio-pure-bite-3er-pack-150-g-cashew-000000000628677001"
},
{
"n": "Pure Bite Kakao (NUR NUR NATUR)",
"a": [
"Pure Bite Kakao",
"nur nur natur Pure Bite Kakao",
"NNN Pure Bite Kakao"
],
"k": 435,
"p": 9.8,
"c": 47.8,
"f": 20.7,
"b": 9.1,
"u": "g",
"s": "nur-nur-natur-bio-pure-bite-3er-pack-150-g-kakao-000000000628677002"
},
{
"n": "Bergbauern-Weichkäse Würzig (NUR NUR NATUR)",
"a": [
"Bergbauern-Weichkäse Würzig",
"nur nur natur Bergbauern-Weichkäse Würzig",
"NNN Bergbauern-Weichkäse Würzig"
],
"k": 312,
"p": 19.0,
"c": 0.0,
"f": 26.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-bergbauern-weichkaese-200-g-wuerzig-000000000677834002"
},
{
"n": "Bergbauern-Weichkäse Mild (NUR NUR NATUR)",
"a": [
"Bergbauern-Weichkäse Mild",
"nur nur natur Bergbauern-Weichkäse Mild",
"NNN Bergbauern-Weichkäse Mild"
],
"k": 312,
"p": 19.0,
"c": 0.0,
"f": 26.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-bergbauern-weichkaese-200-g-mild-000000000677834001"
},
{
"n": "Landhähnchen Flügel Natur (NUR NUR NATUR)",
"a": [
"Landhähnchen Flügel Natur",
"nur nur natur Landhähnchen Flügel Natur",
"NNN Landhähnchen Flügel Natur"
],
"k": 185,
"p": 18.0,
"c": 5.0,
"f": 12.0,
"b": null,
"u": "g",
"s": "nur-nur-natur-bio-landhaehnchen-fluegel-350-g-natur-000000000525617001"
},
{
"n": "Sauerkonserven Karottensalat (NUR NUR NATUR)",
"a": [
"Sauerkonserven Karottensalat",
"nur nur natur Sauerkonserven Karottensalat",
"NNN Sauerkonserven Karottensalat"
],
"k": 52,
"p": 0.7,
"c": 9.8,
"f": 0.2,
"b": 3.0,
"u": "g",
"s": "nur-nur-natur-bio-sauerkonserven-190-g-karottensalat-000000000592725001"
},
{
"n": "Sauerkonserven Rote Beete (NUR NUR NATUR)",
"a": [
"Sauerkonserven Rote Beete",
"nur nur natur Sauerkonserven Rote Beete",
"NNN Sauerkonserven Rote Beete"
],
"k": 42,
"p": 1.0,
"c": 7.9,
"f": 0.1,
"b": 2.0,
"u": "g",
"s": "nur-nur-natur-bio-sauerkonserven-220-g-rote-beete-000000000592725002"
},
{
"n": "Roggenvollkornbrot (NUR NUR NATUR)",
"a": [
"Roggenvollkornbrot",
"nur nur natur Roggenvollkornbrot",
"NNN Roggenvollkornbrot"
],
"k": 184,
"p": 4.2,
"c": 34.0,
"f": 1.2,
"b": 9.0,
"u": "g",
"s": "nur-nur-natur-bio-roggenvollkornbrot-375-g-000000000000495763",
"x": "Seite nennt „pro 375 g“, die Werte passen aber nur zu 100 g"
},
{
"n": "Apfeldirektsaft (NUR NUR NATUR)",
"a": [
"Apfeldirektsaft",
"nur nur natur Apfeldirektsaft",
"NNN Apfeldirektsaft"
],
"k": 44,
"p": 0.0,
"c": 10.0,
"f": 0.0,
"b": null,
"u": "ml",
"s": "nur-nur-natur-bio-apfeldirektsaft-750-ml-000000000000603817"
},
{
"n": "Emmerflocken (NUR NUR NATUR)",
"a": [
"Emmerflocken",
"nur nur natur Emmerflocken",
"NNN Emmerflocken"
],
"k": 330,
"p": 11.2,
"c": 59.7,
"f": 2.7,
"b": 11.2,
"u": "g",
"s": "nur-nur-natur-bio-emmerflocken-500-g-000000000000703170"
},
{
"n": "Olivenöl nativ extra (NUR NUR NATUR)",
"a": [
"Olivenöl nativ extra",
"nur nur natur Olivenöl nativ extra",
"NNN Olivenöl nativ extra"
],
"k": 828,
"p": 0.0,
"c": 0.0,
"f": 91.6,
"b": 0.0,
"u": "ml",
"s": "nur-nur-natur-bio-olivenoel-nativ-extra-500-ml-000000000000694604"
}
];
function migrate(){
  try{
    if(localStorage.getItem(FLAG)==='1'||!window.GSFoodIndex?.importCatalogue)return;
    window.GSFoodIndex.importCatalogue(ITEMS.map(x=>({name:x.n,aliases:x.a,menge:100,einheit:x.u,kcal:x.k,protein_g:x.p,kohlenhydrate_g:x.c,fett_g:x.f,ballaststoffe_g:x.b,sicher:true,marke_oder_quelle:BASE+x.s+(x.x?' · '+x.x:'')})));
    localStorage.setItem(FLAG,'1');
  }catch(e){console.error('NUR-NUR-NATUR-Produkte konnten nicht übernommen werden',e)}
}
window.GSNurNurNatur={ITEMS,migrate};
migrate();
})();
