<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$host='localhost'; $usuario='root'; $clave=''; $base='bodega-agro2.2';
try { $db=new mysqli($host,$usuario,$clave,$base); $db->set_charset('utf8mb4'); }
catch(Throwable $e) { http_response_code(500); die('No se pudo conectar a la base de datos. Revisa php/conex.php y que MySQL esté iniciado.'); }
