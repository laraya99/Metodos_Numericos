import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Parser } from 'expr-eval-ex';
import { ToastrService } from 'ngx-toastr';
import { ParametersForms } from 'src/app/utils/parametersForm';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
}) 
export class HomeComponent implements OnInit, AfterViewInit {
  //Columnas de la tabla
  displayedColumns: string[] = ['intervalo', 'a', 'b', 'x1','error'];
  //Datos de la tabla
  dataSource=new MatTableDataSource();
  //Paginator
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  //Variable que va a guardar el # de decimales
  decimales = 0;
  //Variable que va a guardar la raiz aproximada
  raiz_aproximada = 0;
  //Variable para instanciar la libreria parser
  parser;
  //Variable para guardar la ecuación
  ecuacion = "";

  constructor(
    public parameters:ParametersForms,
    private toastr: ToastrService,
  ) { 
    //Instancia de la librería parse que nos permite leer las ecuaciones y sustituir las variables de estas
    this.parser = new Parser({
      operators: {
        // These default to true, but are included to be explicit
        add: true,
        concatenate: true,
        conditional: true,
        divide: true,
        factorial: true,
        multiply: true,
        power: true,
        remainder: true,
        subtract: true,
    
        // Disable and, or, not, <, ==, !=, etc.
        logical: false,
        comparison: false,
    
        // The in operator is disabled by default in the current version
        'in': true
      }
    });
  }

  ngAfterViewInit(): void {
    //Formato del paginador
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
  }

  calcular(){
    let conta = 0;
    this.ecuacion = this.parameters.baseForm.value.funcion;
    //Variable comodin
    let calc = 0;
    //Variable que lleva las iteraciones
    let inter = 1;
    //Variable que va a guardar los puntos medios
    let f_d = 112;
    //Guarda la tolerancia
    let tolerancia = this.parameters.baseForm.value.error;
    //Guardan los limites
    let xa =this.parameters.baseForm.value.limiteInferior;
    let xb = this.parameters.baseForm.value.limiteSuperior;
    let xaux =  0;
    let incog = 0;
    if (xa.length != 0 && xb.length != 0 && this.ecuacion.length != 0 && tolerancia.length != 0){
      if (!isNaN(xa) && !isNaN(xb)) {
        calc = 1;
        if (xa>xb){
          xaux = xa;
          xa = xb;
          xb = xaux;
        }
      }
  
      //Agrego signos de multiplicación donde corresponda
      for (let index = 0; index <= this.ecuacion.length; index++) {
        const element = this.ecuacion[index];
        if ((element == "x" && !isNaN(parseInt(this.ecuacion[index-1],10))) || (element == "(" && this.ecuacion[index-1] == ")")){
          this.ecuacion = this.ecuacion.substring(0, index) + "*" + this.ecuacion.substring(index);
          index++;
        }
      }
      //Valida que exista una incognita
      for (let index = 0; index <= this.ecuacion.length; index++) {
        const element = this.ecuacion[index];
        if (element == "x"){
          incog = 1;
        }
      }
      if (incog == 1){
        let limin = this.funcion(xa);
        let limmax = this.funcion(xb);
        if (limin > 0 && limmax > 0 || limin < 0 && limmax < 0){
          calc = 4;
        }
        if (calc != 4){
          //Guarda el punto medio anterior
          let punto_anterior = 0;
          //Guarda el margen de error
          let calculo = tolerancia+1;
          //Array que va almacenando los resultados de cada iteración
          let resultados = [{}];
          while (Math.abs(calculo) >= tolerancia){
            let punto_medio = (( parseFloat(xa) + parseFloat(xb))/2);
            //Llama a la función para que sustituya x con el # del limite inferior
            let f_a = this.funcion(xa).toFixed(this.decimales);
            //Llama a la función para que sustituya x con el resultado del punto medio
            f_d = this.funcion(punto_medio).toFixed(this.decimales);
      
      
            if(punto_medio != 0){
              calculo = ((punto_medio - punto_anterior)/punto_medio);
            }
      
            if(inter == 1){
              resultados = [{intervalo:inter,a:xa,b:xb,x1:Math.abs(f_d),error:100}];
            }else{
              resultados.push({intervalo:inter,a:xa,b:xb,x1:Math.abs(f_d),error:calculo == 0?Math.abs(punto_medio):Math.abs(calculo)});
            }
            
      
            let faxfd = f_a*f_d
      
            if(faxfd>0){
              xa = punto_medio.toFixed(this.decimales)
              punto_anterior = punto_medio;
            }else{
              xb = punto_medio.toFixed(this.decimales)
              punto_anterior = punto_medio;
            }
      
            if(Math.abs(calculo)<=tolerancia){
              break
            }
      
      
            inter++;  
          }
          this.parameters.baseForm.patchValue({result: Math.abs(punto_anterior)});
          this.raiz_aproximada = Math.abs(punto_anterior);
          this.dataSource.data=resultados;
        }else{
          this.toastr.warning('No hay raíz en el intervalo seleccionado', 'Verifique el intervalo')
        }
      }else{
        this.toastr.error('No hay una incognita en la función', 'Verifique la función')
        //AGREGA MSJ DE INCOGNITA
      }
    }else {
      this.toastr.warning('Debe completar todos los campos para poder realizar el calculo', 'Verifique la información')
      //AGREGA MSJ DE DATOS
    }
    
  }

  funcion(f_x:number){
    //Pasa la ecuación 
    let f = this.parser.parse(this.ecuacion);
    
    //Susituye las variables de la ecuación con el valor dado y devuevle el resultado
    return f.evaluate({x:f_x});
  }

}
