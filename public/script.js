document.addEventListener("DOMContentLoaded", function () {
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});

function siguiente(){

    fetch('/siguientePag', {
        method: 'GET'
    }).then(response => {     
        return response.json();
    }).then(data => {
        let datos = data.data;

        let objetivo = document.getElementById("objetivo");

        objetivo.innerHTML = "";

        impresion = ``;

        datos.forEach(element => {
            impresion += `
            <div class="row">
                <div class="col-12 col border my-1">
                    <div class="row p-2 fila">
                        <div class="col-4">
                            <h3>${element.nombre}</h3>
                        </div>
                        <div class="col-8 d-flex justify-content-evenly">
                            <a href="/accesoGrupo/${element.grupoid}" class="btn btn-primary mx-2">Acceder</a>
                            <a href="/paginaFactura/${element.grupoid}" class="btn btn-primary mx-2">Añadir factura</a>
                        </div>
                    </div> 
                </div>
            </div>
            `
        });

        objetivo.innerHTML = impresion;

        if(data.data.length < 2){
            document.getElementById("siguiente").disabled=true;
            document.getElementById("ultima").disabled=true;
        }

        document.getElementById("anterior").disabled=false;
        document.getElementById("primera").disabled=false;
        
    }).catch(error => {
        console.log('Error:', error);
    });
}

function anterior(){

    fetch('/anteriorPag', {
        method: 'GET'
    }).then(response => {     
        return response.json();
    }).then(data => {

        let datos = data.data;

        let objetivo = document.getElementById("objetivo");

        objetivo.innerHTML = "";

        impresion = ``;

        datos.forEach(element => {
            impresion += `
            <div class="row">
                <div class="col-12 col border my-1">
                    <div class="row p-2 fila">
                        <div class="col-4">
                            <h3>${element.nombre}</h3>
                        </div>
                        <div class="col-8 d-flex justify-content-evenly">
                            <a href="/accesoGrupo/${element.grupoid}" class="btn btn-primary mx-2">Acceder</a>
                            <a href="/paginaFactura/${element.grupoid}" class="btn btn-primary mx-2">Añadir factura</a>
                        </div>
                    </div> 
                </div>
            </div>
            `
        });

        objetivo.innerHTML = impresion;

        if(data.primeraPagina){
            document.getElementById("anterior").disabled=true;
            document.getElementById("primera").disabled=true
        }

        document.getElementById("siguiente").disabled=false;
        document.getElementById("ultima").disabled=false;
        
    }).catch(error => {
        console.log('Error:', error);
    });
}

function primera(){
    console.log("primera")

    fetch('/primeraPag', {
        method: 'GET'
    }).then(response => {     
        return response.json();
    }).then(data => {

        let datos = data.data;

        let objetivo = document.getElementById("objetivo");

        objetivo.innerHTML = "";

        impresion = ``;

        datos.forEach(element => {
            impresion += `
            <div class="row">
                <div class="col-12 col border my-1">
                    <div class="row p-2 fila">
                        <div class="col-4">
                            <h3>${element.nombre}</h3>
                        </div>
                        <div class="col-8 d-flex justify-content-evenly">
                            <a href="/accesoGrupo/${element.grupoid}" class="btn btn-primary mx-2">Acceder</a>
                            <a href="/paginaFactura/${element.grupoid}" class="btn btn-primary mx-2">Añadir factura</a>
                        </div>
                    </div> 
                </div>
            </div>
            `
        });

        objetivo.innerHTML = impresion;

        if(data.primeraPagina){
            document.getElementById("anterior").disabled=true;
            document.getElementById("primera").disabled=true
        }

        document.getElementById("siguiente").disabled=false;
        document.getElementById("ultima").disabled=false;
        
    }).catch(error => {
        console.log('Error:', error);
    });
}

function ultima(){
    console.log("ultima")

    fetch('/ultimaPag', {
        method: 'GET'
    }).then(response => {     
        return response.json();
    }).then(data => {

        let datos = data.data;

        let objetivo = document.getElementById("objetivo");

        objetivo.innerHTML = "";

        impresion = ``;

        datos.forEach(element => {
            impresion += `
            <div class="row">
                <div class="col-12 col border my-1">
                    <div class="row p-2 fila">
                        <div class="col-4">
                            <h3>${element.nombre}</h3>
                        </div>
                        <div class="col-8 d-flex justify-content-evenly">
                            <a href="/accesoGrupo/${element.grupoid}" class="btn btn-primary mx-2">Acceder</a>
                            <a href="/paginaFactura/${element.grupoid}" class="btn btn-primary mx-2">Añadir factura</a>
                        </div>
                    </div> 
                </div>
            </div>
            `
        });

        objetivo.innerHTML = impresion;

        if(data.data.length < 2){
            document.getElementById("siguiente").disabled=true;
            document.getElementById("ultima").disabled=true;
        }

        document.getElementById("anterior").disabled=false;
        document.getElementById("primera").disabled=false;
        
    }).catch(error => {
        console.log('Error:', error);
    });
}