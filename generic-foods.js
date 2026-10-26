/* Get Shaped – Allgemeine Lebensmittel (Gemüse, Obst, Fleisch inkl. Wild, Fisch, Milchprodukte, Backzutaten, Getränke …).
   Richtwerte pro 100 g bzw. 100 ml aus gängigen Nährwerttabellen, gerundet; Zustand roh bzw. wie verkauft, wenn nichts anderes dabeisteht.
   Niedrigste Priorität: eigener Katalog, Rezepte und bisher Gegessenes gehen vor. */
(() => {
'use strict';
const SOURCE='Richtwert (Nährwerttabellen, gerundet)';
// Name | Aliase (;) | kcal | Eiweiß | KH | Fett | Ballaststoffe | Stückgewicht g (optional)
const ROWS=`
Spargel weiß|Spargel;weißer Spargel;Stangenspargel|18|1.9|2|0.1|1.5
Spargel grün|grüner Spargel|20|2.2|2|0.2|2.1
Grünkohl|Grünkohl;Federkohl|37|4.3|2.5|0.9|4.2
Rotkohl|Rotkohl;Blaukraut;Rotkraut|27|1.5|4|0.2|2.5
Weißkohl|Weißkohl;Weißkraut|25|1.3|3.6|0.2|2.5
Wirsing|Wirsing;Wirsingkohl|30|3|3|0.4|3
Chinakohl|Chinakohl|13|1.2|1.3|0.2|1
Spitzkohl|Spitzkohl|25|1.7|3.3|0.2|2
Kohlrabi|Kohlrabi|24|1.7|3.7|0.1|1.4|200
Fenchel|Fenchel;Fenchelknolle|28|1.2|4.2|0.2|3.1|250
Lauch|Lauch;Porree|29|2.1|3.3|0.3|2.3
Frühlingszwiebel|Frühlingszwiebel;Frühlingszwiebeln;Lauchzwiebel|26|1.8|3.2|0.3|2.6
Schalotte|Schalotte;Schalotten|72|2.5|16.8|0.1|3.2|25
Radieschen|Radieschen|15|1.1|2.1|0.1|1.6
Rote Bete|Rote Bete;Rote Beete;Rote Rübe;Rote Bete roh|43|1.6|8.4|0.1|2.8
Süßkartoffel|Süßkartoffel;Süßkartoffeln|86|1.6|20|0.1|3|200
Pastinake|Pastinake;Pastinaken|75|1.2|13|0.3|4.9
Aubergine|Aubergine;Auberginen|24|1|2.5|0.2|3.4|250
Hokkaido-Kürbis|Hokkaido;Hokkaido Kürbis;Kürbis Hokkaido|34|1.1|6|0.2|2.6
Erbsen|Erbsen;grüne Erbsen;Erbsen TK|70|5.5|10|0.4|5.1
Grüne Bohnen|grüne Bohnen;Brechbohnen;Prinzessbohnen;Bohnen grün|31|1.8|3.6|0.2|2.9
Mangold|Mangold|19|1.8|2.1|0.2|1.6
Rucola|Rucola;Rauke|25|2.6|2.1|0.7|1.6
Feldsalat|Feldsalat;Rapunzel|19|2|0.7|0.4|1.5
Eisbergsalat|Eisbergsalat;Eisberg|14|0.9|2|0.2|1.3
Ingwer|Ingwer;frischer Ingwer|80|1.8|17.8|0.8|2
Chili frisch|Chili;Chilischote;Chilischoten;Peperoni|40|2|6|0.4|1.5
Edamame|Edamame|122|11.9|8.9|5.2|5.2
Artischocke|Artischocke;Artischocken|47|3.3|5.1|0.2|5.4
Okra|Okra|33|1.9|7.5|0.2|3.2
Pak Choi|Pak Choi;Pak-Choi|13|1.5|1.2|0.2|1
Tomatenmark|Tomatenmark|80|4.5|13|0.5|4
Passierte Tomaten|passierte Tomaten;Passata;Tomaten passiert|25|1.3|4|0.2|1.2
Tomaten aus der Dose|Dosentomaten;gehackte Tomaten;Tomaten Dose;Tomaten gehackt|22|1.1|3.5|0.2|1.2
Birne|Birne;Birnen|57|0.4|12.4|0.3|3.1|170
Pfirsich|Pfirsich;Pfirsiche|41|0.8|8.9|0.1|1.5|150
Nektarine|Nektarine;Nektarinen|44|1.1|8.6|0.3|1.7|140
Aprikose|Aprikose;Aprikosen;Marille|43|0.9|8.5|0.1|1.6|45
Kirschen|Kirschen;Süßkirschen|63|1.1|13.3|0.3|1.3
Weintrauben|Weintrauben;Trauben|69|0.7|15.2|0.2|0.9
Kiwi|Kiwi;Kiwis|51|1|9.1|0.6|2.1|75
Mango|Mango|60|0.8|13.4|0.4|1.7|300
Honigmelone|Honigmelone;Melone|54|0.6|12.4|0.1|0.6
Zitrone|Zitrone;Zitronen|34|0.7|3.2|0.6|1.2|80
Grapefruit|Grapefruit|42|0.6|9.1|0.1|1.4|250
Mandarine|Mandarine;Mandarinen;Clementine;Clementinen|46|0.7|10|0.2|1.9|60
Johannisbeeren|Johannisbeeren;rote Johannisbeeren|41|1.1|7.3|0.2|3.5
Brombeeren|Brombeeren|43|1.4|4.9|0.5|5.3
Preiselbeeren|Preiselbeeren|46|0.4|8.7|0.5|3.5
Feigen|Feigen;frische Feigen|74|0.8|16|0.3|2.9|50
Getrocknete Feigen|Feigen getrocknet;getrocknete Feigen|250|3.3|48|1.2|9.8
Rosinen|Rosinen|300|3.1|66|0.5|4.5
Getrocknete Aprikosen|Aprikosen getrocknet;Trockenaprikosen|240|3.6|50|0.6|7.3
Granatapfel|Granatapfel|83|1.7|13.7|1.2|4
Kokosnuss|Kokosnuss;Kokosfleisch|354|3.3|6.2|33.5|9
Kokosraspel|Kokosraspel;Kokosflocken|610|6|6|62|14
Zitronensaft|Zitronensaft|25|0.4|2.5|0|0
Rehrücken|Rehrücken;Rehfilet;Rehkeule;Rehfleisch;Reh|110|22.4|0|1.7|0
Hirsch|Hirsch;Hirschfleisch;Hirschrücken;Hirschkeule|115|22.9|0|2|0
Wildschwein|Wildschwein;Wildschweinfleisch|122|21.5|0|3.3|0
Hase|Hase;Hasenrücken;Hasenfleisch|111|22|0|2|0
Kaninchen|Kaninchen;Kaninchenfleisch|133|21.8|0|4|0
Lammkeule|Lammkeule;Lammfleisch;Lamm|160|20|0|9|0
Lammkotelett|Lammkotelett;Lammlachse|220|18|0|16|0
Schweinefilet|Schweinefilet|108|22|0|2|0
Schweineschnitzel|Schweineschnitzel;Schweinesteak;Schweinefleisch mager|110|21.5|0|2.5|0
Schweinenacken|Schweinenacken;Schweinekamm|160|19.5|0|9|0
Schweinebauch|Schweinebauch|330|14|0|30|0
Hähnchenkeule|Hähnchenkeule;Hähnchenschenkel;Hühnerkeule|165|19|0|9.5|0
Hähnchenflügel|Hähnchenflügel;Chicken Wings;Hühnerflügel|200|18|0|14|0
Putenschenkel|Putenschenkel;Putenkeule|115|20|0|3.5|0
Putenhackfleisch|Putenhackfleisch;Putenhack|135|20|0|6|0
Entenbrust|Entenbrust|190|18|0|13|0
Ente|Ente;Entenkeule|200|17|0|15|0
Kalbsleber|Kalbsleber|140|19.5|2|5|0
Rinderleber|Rinderleber;Leber|135|20|4|3.6|0
Rumpsteak|Rumpsteak;Hüftsteak;Rinderhüfte|135|21|0|5|0
Rindergulasch|Rindergulasch;Gulaschfleisch;Rindfleisch mager|125|21.5|0|4|0
Rinderbrust|Rinderbrust|200|19|0|13|0
Kassler|Kassler;Kasseler|145|21|0|7|0
Kochschinken|Kochschinken;Schinken gekocht;Schinken|120|20|1|4|0
Rohschinken|Rohschinken;Schinken roh;Parmaschinken;Serrano|240|27|0.5|14|0
Bacon|Bacon;Frühstücksspeck;Speck|420|14|0.5|40|0
Leberwurst|Leberwurst|330|12|1|31|0
Bratwurst|Bratwurst|300|13|1.5|27|0|120
Wiener Würstchen|Wiener;Würstchen|280|12|1|26|0|50
Fleischwurst|Fleischwurst|290|11|1.5|27|0
Kabeljau|Kabeljau;Dorsch|82|17.8|0|0.7|0
Seelachs|Seelachs;Köhler|80|18.3|0|0.9|0
Heilbutt|Heilbutt|100|20.5|0|2.2|0
Scholle|Scholle|90|17.5|0|1.5|0
Zander|Zander|85|18.4|0|0.9|0
Dorade|Dorade;Goldbrasse|100|19.5|0|2.3|0
Wolfsbarsch|Wolfsbarsch;Branzino|97|18|0|2.5|0
Makrele|Makrele|205|18.7|0|14.4|0
Hering|Hering;Matjes|190|17|0|13|0
Sardinen|Sardinen;Sardine|150|20|0|8|0
Thunfischsteak|Thunfischsteak;frischer Thunfisch|140|24|0|5|0
Räucherlachs|Räucherlachs;geräucherter Lachs|180|18.3|0|12|0
Tintenfisch|Tintenfisch;Calamari|75|15|1|1|0
Muscheln|Muscheln;Miesmuscheln|75|11|3|2|0
Pangasius|Pangasius|95|15|0|3.5|0
Ricotta|Ricotta|170|8|3|13|0
Mascarpone|Mascarpone|430|4.6|3.5|44|0
Frischkäse Doppelrahm|Frischkäse;Doppelrahmfrischkäse|300|6|3|29|0
Camembert|Camembert|300|20|0.5|24|0
Brie|Brie|330|20|0.5|27|0
Emmentaler|Emmentaler|380|28|0|30|0
Bergkäse|Bergkäse;Appenzeller;Gruyère|400|28|0|32|0
Edamer|Edamer|330|25|0|25|0
Halloumi|Halloumi;Grillkäse|320|22|2|25|0
Ziegenkäse|Ziegenkäse;Ziegenfrischkäse|270|18|1|21|0
Schmand|Schmand|200|3|3.5|20|0
Crème fraîche|Crème fraîche;Creme fraiche|300|2.5|3.5|30|0
Saure Sahne|saure Sahne|160|3|4|15|0
Buttermilch|Buttermilch|36|3.5|4|0.5|0
Kefir|Kefir|60|3.4|4|3.5|0
Sojadrink|Sojadrink;Sojamilch|40|3.3|2.5|1.8|0.5
Hafermilch|Hafermilch;Haferdrink|45|1|6.5|1.5|0.8
Mandelmilch|Mandelmilch;Mandeldrink|24|0.5|3|1.1|0.3
Kokosmilch|Kokosmilch;Kokosmilch Dose|180|1.7|3|18|0
Eigelb|Eigelb|320|16|0.5|28|0|20
Nudeln trocken|Nudeln;Spaghetti;Pasta;Penne;Fusilli;Tagliatelle;Nudeln trocken|355|12.5|72|1.5|3
Nudeln gekocht|Nudeln gekocht;Spaghetti gekocht;Pasta gekocht|135|5|26|0.9|1.8
Vollkornnudeln|Vollkornnudeln;Vollkornspaghetti|340|13|63|2.5|8
Couscous|Couscous|360|12.5|73|1.5|4
Quinoa|Quinoa|360|14|60|6|7
Bulgur|Bulgur|340|12|62|1.5|10
Hirse|Hirse|360|11|69|4|4
Dinkelmehl|Dinkelmehl|340|11|68|2.5|4
Roggenmehl|Roggenmehl|330|9|65|1.5|8
Paniermehl|Paniermehl;Semmelbrösel|360|12|72|2.5|3
Speisestärke|Speisestärke;Maisstärke|350|0.5|86|0.1|0
Zucker|Zucker;Haushaltszucker|400|0|100|0|0
Honig|Honig|305|0.4|76|0|0
Ahornsirup|Ahornsirup|260|0|67|0|0
Marmelade|Marmelade;Konfitüre|250|0.5|60|0.1|1
Nuss-Nougat-Creme|Nutella;Nuss-Nougat-Creme;Nussnougatcreme|540|6.3|57.5|31|3
Brötchen|Brötchen;Semmel;Weizenbrötchen|265|9|53|1.5|3|55
Toastbrot|Toast;Toastbrot|265|8|48|3.5|3|25
Baguette|Baguette|270|9|55|1.5|3
Roggenbrot|Roggenbrot;Mischbrot;Brot|210|6|42|1.2|6|45
Knäckebrot|Knäckebrot|330|10|60|2|14|10
Reiswaffeln|Reiswaffeln;Reiswaffel|380|8|80|2.5|3|8
Cornflakes|Cornflakes|370|7|84|0.9|3
Müsli|Müsli;Früchtemüsli|360|9|62|6|8
Mandelmehl|Mandelmehl;gemahlene Mandeln|600|22|9|53|11
Sonnenblumenöl|Sonnenblumenöl;Pflanzenöl;Speiseöl|900|0|0|100|0
Sesamöl|Sesamöl|900|0|0|100|0
Margarine|Margarine|720|0.2|0.5|80|0
Schweineschmalz|Schweineschmalz;Schmalz|900|0|0|100|0
Mayonnaise|Mayonnaise;Mayo|690|1.5|2|75|0
Senf|Senf|90|5|5|5|3
Ketchup|Ketchup|100|1.3|23|0.1|0.5
Balsamico|Balsamico;Balsamico Essig;Aceto Balsamico|90|0.5|17|0|0
Essig|Essig;Weißweinessig;Apfelessig mild|20|0|0.6|0|0
Weiße Bohnen|weiße Bohnen;Cannellini;weiße Bohnen gekocht|100|7|12|0.5|6
Rote Linsen|rote Linsen;Linsen rot;Linsen trocken|340|25|50|1.5|11
Kichererbsen trocken|Kichererbsen trocken|340|20|44|5|14
Seitan|Seitan|120|24|4|1.5|1
Pistazien|Pistazien|600|20|17|52|10
Pekannüsse|Pekannüsse;Pecannüsse|690|9|4|72|9
Macadamia|Macadamia;Macadamianüsse|720|8|5|76|8
Paranüsse|Paranüsse|680|14|4|67|8
Pinienkerne|Pinienkerne|670|14|13|68|4
Sonnenblumenkerne|Sonnenblumenkerne|580|21|12|48|9
Mandelmus|Mandelmus|620|22|7|55|10
Tahini|Tahini;Sesammus|600|18|10|54|9
Erdnüsse|Erdnüsse|600|26|8|49|8
Cola|Cola;Coca Cola;Pepsi|42|0|10.6|0|0
Apfelsaft|Apfelsaft|46|0.1|10.5|0.1|0.1
Orangensaft|Orangensaft|45|0.7|9|0.2|0.2
Bier|Bier;Pils;Helles|43|0.4|3.3|0|0
Wein|Wein;Rotwein;Weißwein|75|0.1|2.5|0|0
Sekt|Sekt;Prosecco|80|0.2|5|0|0
Vollmilchschokolade|Vollmilchschokolade;Milchschokolade;Schokolade|540|7|57|31|2
Zartbitterschokolade|Zartbitterschokolade;Zartbitter;dunkle Schokolade|575|9|34|42|10
Gummibärchen|Gummibärchen;Gummibären;Haribo|345|6.9|77|0.1|0
Kartoffelchips|Chips;Kartoffelchips|530|6.5|50|33|4
Salzstangen|Salzstangen;Brezelstangen|380|10|74|3|3
Butterkekse|Butterkekse;Butterkeks;Keks;Kekse|450|7|72|14|2
Croissant|Croissant|400|8|45|21|2|60
Vanilleeis|Vanilleeis;Eiscreme;Eis;Speiseeis|210|3.5|24|11|0
Popcorn|Popcorn|390|12|60|4|13
`.trim().split('\n');
function register(){
  const idx=window.GSFoodIndex;if(!idx?.registerBase)return;
  const list=ROWS.map(line=>{
    const [name,aliases,kcal,p,c,f,fiber,piece]=line.split('|');
    return {name,aliases:[...new Set([name,...aliases.split(';')].map(idx.norm))],kcal:+kcal,p:+p,c:+c,f:+f,fiber100:+fiber,
      piece:piece?+piece:null,unit:/Cola|saft|Bier|Wein|Sekt|milch|drink|Essig|Balsamico/i.test(name)?'ml':'g',generic:true,source:SOURCE};
  });
  idx.registerBase(list);
}
window.GSGenericFoods={ROWS,register};
register();
})();
