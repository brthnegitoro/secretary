var usersqlvisible = false;
var DB = new Database("DB");


function load(DB){
	$("#tablediv").hide();
	loadCSV(DB, "SKD", "SKD.csv");
}

function DivDocument(){
	this.source = "";
	this.write = _Write;
	this.apply = _Apply;
};
function _Write(str){
	this.source += str;
}
function _Apply(){
	$("#tablediv").html(this.source);
}

/*
 * document以外にも描画できるようにする
 */
function writeTbl(myDB, sql){
	$("#tablediv").hide();
	var doc = new DivDocument();
	sql = $.trim(sql);
	var selected = myDB.Select(sql);
	if (selected.length == 0) {
		doc.write("<p>検索条件に一致するレコードがありませんでした。</p>")
	}
	else {
		//myDB.View(selected, doc);
		MyView(selected, doc);
	}
	doc.apply();
	$("#tablediv").slideDown("slow");
}



/*
 * 標準のViewはカラム名描かせてくれないので独自関数つくった<br />
 */
function MyView (arrPDades, o) {
	//ひとまず決めうち
	var aryColumn = ["日付","番号","時間","内容"];

	o.write("<table>");

	var column="";
	column += "<tr class='header'>";
	for(var i=0; i < aryColumn.length; i++){
		column += "<td>";
		column += aryColumn[i];
		column += "</td>";
	}
	column += "</tr>";
	o.write(column);

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

function loadCSV(myDB, tableName, filename){
	$.ajax({
	    url: filename,
	    type: 'GET',
	    dataType: 'text',
	    timeout: 1000,
	    error: function(){
	        alert('ファイルが見つかりません。');
	    },
	    success: function(xml){
			var table = [];
			//CSVのパース
			lines = xml.split("\r\n");
			for(var i=0; i < lines.length; i++){
				if (lines[i] != "") {
					table.push(lines[i].split(","));
				}
			}
			makeTbl(myDB, table, tableName);
	    }
	});
}

function makeTbl(myDB, table, tableName){
	myDB.CreateTable(tableName,table[0]);

	//ヘッダは抜かす
	for(var i=1; i < table.length; i++){
		myDB.Insert(tableName,table[i]);
	}
}

/**
 * SQL文の作成
 * @author iwai
 */
function makesql(){
    var dt = document.sqlform.dt.value;
    var kw = document.sqlform.kw.value;
    
    sql = "";
    
    sql += "SELECT * FROM SKD " ;
    sql += "WHERE true ";

    if (dt != "") {
      sql += "AND SKD_DATE = \"" + dt + "\" ";
    }

    if (kw != "") {
       sql += " AND SKD LIKE \"" + kw + "\" ";
    }


/*
    sql += "SELECT";
    sql += " HITO_TBL.id,HITO_TBL.name";
    sql += ",PRIVATE_TBL.seibetu,PRIVATE_TBL.age,PRIVATE_TBL.mail,PRIVATE_TBL.tel,PRIVATE_TBL.kikon,PRIVATE_TBL.address";
    sql += ",PUBLIC_TBL.job,PUBLIC_TBL.hobby";
    sql += " FROM HITO_TBL";
    sql += " LEFT JOIN PRIVATE_TBL on HITO_TBL.id = PRIVATE_TBL.id";
    sql += " LEFT JOIN PUBLIC_TBL on HITO_TBL.id = PUBLIC_TBL.id";
    
    sql += " WHERE true";
    if (name != "") {
        if (name.match("%")) {
            sql += " AND HITO_TBL.name LIKE \"" + name + "\"";
        }
        else {
            sql += " AND HITO_TBL.name = \"" + name + "\"";
        }
    }
    
    if (seibetu != "") {
        sql += " AND PRIVATE_TBL.seibetu = \"" + seibetu + "\"";
    }
    
    if (downage != "") {
        sql += " AND PRIVATE_TBL.age >= " + downage;
    }
    
    if (upage != "") {
        sql += " AND PRIVATE_TBL.age <= " + upage;
    }
*/
    
    return sql;
}
