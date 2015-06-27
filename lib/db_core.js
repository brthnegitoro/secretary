/* Creació d'una BD en Javascript 
 * Author: Agustí Garcia i Moll
 * License: GPL (General Public License)
 * Versió: 1.0.0
*/
var strSort;

// dbActual: la Base de dades
// tauPTaula: la taula que hem d'omplir.
// strPTaules: String de la join condició tb.
function CrearJoin (dbActual, strPTaules) {
	var temp = new String(strPTaules);
	temp = temp.replace(/^(.+) (inner|left|right) join (.+) on (.+)/gi,"Array('$1','$3','$4','$2')");
	var arrDades = eval(temp);
	var strLTaula1 = arrDades[0];
	var strLTaula2 = arrDades[1];
	var strLCondicio = arrDades[2];
	var intTipus = (arrDades[3].toLowerCase().indexOf("inner") != -1) ? 0 : (arrDades[3].toLowerCase().indexOf("left") != -1) ? 1 : 2;
	// La unica diferencia entre left i right és quines taules tenim en compte, si jo canvio l'order i el tipus ha de funcionar igual.
	if (intTipus == 2) { strLTaula1 = arrDades[1]; strLTaula2 = arrDades[0]; intTipus = 1; }
	var arrLCamps = new Array ();
	var intArray = 0;
	var tauLTemp001;
	var tauLTemp002;
	var bolLTaulaFinal001;
	var bolLTaulaFinal002;
	if (strLTaula1.toLowerCase().indexOf("join") != -1) {
		tauLTemp001 = CrearJoin (dbActual,strLTaula1);
		bolLTaulaFinal001 = false;
	} else {
		tauLTemp001 = dbActual.taules[strLTaula1];
		bolLTaulaFinal001 = true;
	}	
	if (strLTaula2.toLowerCase().indexOf("join") != -1) {
		tauLTemp002 = CrearJoin (dbActual,strLTaula2);
		bolLTaulaFinal002 = false;
	} else {
		tauLTemp002 = dbActual.taules[strLTaula2];
		bolLTaulaFinal002 = true;
	}

	for (intCamps = 0; intCamps < tauLTemp001.camps.length; intCamps++) {
		arrLCamps[intArray++] = (bolLTaulaFinal001) ? tauLTemp001.nom+"."+tauLTemp001.camps[intCamps] : tauLTemp001.camps[intCamps];
	}
	for (intCamps = 0; intCamps < tauLTemp002.camps.length; intCamps++) {
		arrLCamps[intArray++] = (bolLTaulaFinal002) ? tauLTemp002.nom+"."+tauLTemp002.camps[intCamps] : tauLTemp002.camps[intCamps];		
	}
	var tauPTaula = new Taula("Temporal",arrLCamps);
	
	var arrRetorn = new Array();
	var intRetorn = 0;
	var bolLHiHaConcordancia;
	var strCondicioInterna = interpretaWhere (strLCondicio);
	for (intY = 0; intY < tauLTemp001.registres.length; intY++) {
		bolLHiHaConcordancia = false;
		for (intX = 0; intX < tauLTemp002.registres.length; intX++) {
			var arrLValors = new Array();
			intArray = 0
			for (intCamps = 0; intCamps < tauLTemp001.camps.length; intCamps++) {
				arrLValors[intArray++] = tauLTemp001.registres[intY][tauLTemp001.camps[intCamps]];
			}
			for (intCamps = 0; intCamps < tauLTemp002.camps.length; intCamps++) {
				arrLValors[intArray++] = tauLTemp002.registres[intX][tauLTemp002.camps[intCamps]];
			}
			//Comprovar condicio del join
			if(FiltrarJoin(arrLCamps,arrLValors,strCondicioInterna)) {
				tauPTaula.InsertarRegistre(arrLValors);
				bolLHiHaConcordancia = true;
			}
		}
		if(!bolLHiHaConcordancia && intTipus == 1) {
			var arrLValors = new Array();
			intArray = 0
			for (intCamps = 0; intCamps < tauLTemp001.camps.length; intCamps++) {
				arrLValors[intArray++] = tauLTemp001.registres[intY][tauLTemp001.camps[intCamps]];
			}
			for (intCamps = 0; intCamps < tauLTemp002.camps.length; intCamps++) {
				arrLValors[intArray++] = "";
			}
			tauPTaula.InsertarRegistre(arrLValors);
		}
	}
	return (tauPTaula);
}
function FiltrarJoin (arrPCamps,arrPValors,strCondicio){
// Aquí hem de filtrar la condició del join.
	var intLIndex ;

	var temp = new String(strCondicio);
	// Aquest replace no funciona bé s'ha de veure pq...
	temp = temp.replace(/this\.registres\[intX\]/gi,"newPseudoRegistre");
	var newPseudoRegistre = new Array();
	for (intLIndex = 0; intLIndex < arrPCamps.length; intLIndex++) {
		newPseudoRegistre[arrPCamps[intLIndex]] = arrPValors[intLIndex];
	}
	return eval(temp);
}
function _InsertarRegistre(arrPVariables){
	var intLIndex;

	var newRegistre = new Array();
	for (intLIndex = 0; intLIndex < this.camps.length; intLIndex++) {
		newRegistre[this.camps[intLIndex]] = arrPVariables[intLIndex];
	}
	this.registres[this.registres.length] = newRegistre;
}
function doWhereLike (cadena,expresio) {
	var temp = expresio;
	var temp2 = new String(cadena);
	temp = temp.replace(/%/gi,".*");
	temp = "/^"+temp+"/gi";
	valor = eval("temp2.search("+temp+")");
	return (valor != -1); 
}
function interpretaWhere (strWhere) {
/* Inserta unes condició en forma sql i genera la condició a evaluar en el sistema */
	var temp = new String(strWhere);
	temp = temp.replace(/([\w\.]+)\s+like\s+([\w%]+|\"[^\"]*\")/gi,"doWhereLike(this.registres[intX][\"$1\"],$2)");
	temp = temp.replace(/([\w\.]+)\s*=\s*([0-9\.,]+|\"[^\"]*\")/gi,"this.registres[intX][\"$1\"] == $2");
	temp = temp.replace(/([\w\.]+)\s*=\s*([\w\.]+)/gi,"this.registres[intX][\"$1\"] == this.registres[intX][\"$2\"]");
	temp = temp.replace(/([\w\.]+)\s*<>\s*([0-9\.,]+|\"[^\"]*\")/gi,"this.registres[intX][\"$1\"] != $2");
	temp = temp.replace(/([\w\.]+)\s*<>\s*([\w\.]+)/gi,"this.registres[intX][\"$1\"] != this.registres[intX][\"$2\"]");
	temp = temp.replace(/([\w\.]+)\s*([<>]|<=|>=)\s*([\w]+|\"[^\"]*\")/gi,"this.registres[intX][\"$1\"] $2 $3");
	temp = temp.replace(/\s+and\s+/gi," && ");
	temp = temp.replace(/\s+or\s+/gi," || ");
	return temp;
}
function crearFuncioOrdenar(strOrderBy,arrPCamps) {
	var temp = new String(strOrderBy);
	var boolTipus;
	var boolTrobat;
	var strRetorn = "1";
	var intIndex;

	temp = temp.replace(/ +/gi," "); //Borrem tots els espais en blanc de més a més
	var parametres = temp.split(",");
	for(intIndex = parametres.length; intIndex > 0; intIndex--) {
		boolTipus = 0;
		divisio = new String(parametres[intIndex-1]);
		divisio = divisio.split(" ");
		if (divisio.length > 1) {
			if (divisio[1].toUpperCase() == "DESC") { boolTipus = 1; }
		}
		for (intCamps = 0; intCamps < arrPCamps.length; intCamps++) {
			if (divisio[0] == arrPCamps[intCamps]) {
				strRetorn = "(a["+intCamps+"]"+(boolTipus ? ">" : "<")+"b["+intCamps+"] ? -1 : (a["+intCamps+"]==b["+intCamps+"] ? "+strRetorn+" : 0))";
			}
		}
	}
	return (strRetorn);
}

function ordenar (a,b) {
	return (eval (strSort));
}

function _SelectTable (arrPCamps,strWhere,strOrderBy){
	var arrRetorn = new Array();
	var intRetorn = 0;
	var strCondicioInterna = (strWhere == "") ? "true" : interpretaWhere (strWhere);
	
	for (intX = 0; intX < this.registres.length; intX++) {
		/* El where aquí hem de determinar si aquest registre acompleix les condicions*/
		if (eval(strCondicioInterna)) {
			/* Posa registre a l'Array de retorn*/
			arrRetorn[intRetorn] = new Array();
			for (intCamps = 0; intCamps < arrPCamps.length; intCamps++) {
				arrRetorn[intRetorn][intCamps] = this.registres[intX][arrPCamps[intCamps]];
			}
			intRetorn++;
			/* Final d'Insersió de registre */
		}
	}
	/* Si s'ha de fer, s'ordena l'array */
	if (strOrderBy != "") {
		strSort = crearFuncioOrdenar(strOrderBy,arrPCamps);
		arrRetorn.sort(ordenar);
	}
	/* Final de l'ordnació */
	return (arrRetorn);
}

function _View (arrPDades, o) {
	o.write("<table>");
	for (intX = 0; intX < arrPDades.length; intX++) {
		o.write("<tr>");
		for (intY = 0; intY < arrPDades[intX].length; intY++){
			o.write("<td>");
			o.write(arrPDades[intX][intY]+" ");
			o.write("</td>");
		}
		o.write("</tr>");
	}
	o.write("</table>");
}

function Taula (strPnom, arrPCamps) {
	/* Propietats */
	this.nom = strPnom;
	this.camps = arrPCamps;
	this.registres = new Array();

	/* Metodes */
	this.InsertarRegistre = _InsertarRegistre;
	this.Select = _SelectTable;
}

function _Select (strPQuery) {
	var temp = new String(strPQuery);
	
	temp = temp.replace(/^select (.+) from (.+) where (.+) order by (.+)/gi,"this.SelectPrivate(\"$2\",\"$1\",'$3','$4')");
	temp = temp.replace(/^select (.+) from (.+) where (.+)/gi,"this.SelectPrivate(\"$2\",\"$1\",'$3','')");
	temp = temp.replace(/^select (.+) from (.+) order by (.+)/gi,"this.SelectPrivate(\"$2\",\"$1\",'','$3')");
	temp = temp.replace(/^select (.+) from (.+)/gi,"this.SelectPrivate(\"$2\",\"$1\",'','')");
	return (eval(temp));
}
function _SelectPrivate (strPTaula, strPCamps, strPWhere, strOrderBy) {
	var strLTemp = new String(strPCamps);
	var tauLTaula = this.taules[strPTaula];
	var strLCamps = "Array(";

	arrLTemp = strLTemp.split(",");
	for(intX=0;intX < arrLTemp.length; intX++){
		if(arrLTemp[intX] == "*") {
			for(intY=0; intY < tauLTaula.camps.length; intY++) {
				strLCamps += '"'+ tauLTaula.camps[intY] +'",';
			}
		} else {
			strLCamps += '"' + arrLTemp[intX] + '",';
		}
	}	
	strLCamps = strLCamps.substr(0,strLCamps.length-1)+")";
	

	if (strPTaula.toLowerCase().indexOf("join") != -1) {
	// Es una join:
	// Creem la taula temporal.
	
	var tauTemporal;
	// Posem els valors de la join
	tauTemporal = CrearJoin (this,strPTaula);
	// Retornem les dades de la Taula
	return(eval("tauTemporal.Select("+strLCamps+",strPWhere,strOrderBy)"));
	// L'Esborrem la taula
	} else {
	return(eval('this.taules["'+strPTaula+'"].Select('+strLCamps+',\''+strPWhere+'\',\''+strOrderBy+'\')'));
	}
}

function _Insert(strPNomTaula, arrPParametres){
	var tauLTemp = this.taules[strPNomTaula];

	if (tauLTemp != null) {
		tauLTemp.InsertarRegistre(arrPParametres);
	}
}

function _CrearTaula(strPnom, arrPCamps) {
	var newTaula = new Taula(strPnom, arrPCamps);

	this.taules[strPnom] = newTaula;
}


function Database (strPnom) {
	this.nom = strPnom;
	this.taules = new Array();
	
	this.CreateTable = _CrearTaula;
	this.Insert = _Insert;
	this.Select = _Select;
	this.SelectPrivate = _SelectPrivate;
	this.View = _View;
}
