import React,{Component} from 'react';
import {Text,View,Dimensions,StatusBar} from 'react-native';
import Games from '../components/Games'
import firebase from 'firebase'
import Header from '../components/Header';
import { TabView, SceneMap,TabBar } from 'react-native-tab-view';
import SnackBars from '../components/SnackBars';

export default class GamesScreen extends Component{

    constructor(props){
        super(props);

        this.state={
            visible: false,
            title:'Juegos',

            refreshing:false,
            

            leagueSelect:'',
            nleagueSelect:'',
            keyTeam:0,

            ligas:[],
            nLigas:[],
            ligasMaster:[],
            equipo:'',
            equipos:[],

            contador:0,

            matchTeam:[],
            matchNext:[],
            matchFinish:[],
            
            visibleSnackBar: false,
            mensajeSnackBar: '',

            index: 0,
            routes: [
            { key: 'first', title: 'Próximos' },
            { key: 'second', title: 'Finalizados' },
            { key: 'third', title: 'Mi equipo'},
            ]
        }
        }

    componentDidMount=()=>{
        this.obtenerLigas();
    }

    handleRefresh=()=>{
        this.setState({refreshing:true});
        this.setState({matchFinish:[]})
        this.setState({matchNext:[]})
        this.setState({matchTeam:[]})

        if(this.state.equipo!=""){
            this.llenarpartidosEquipo();
        }
        if(this.state.leagueSelect!=""){
            this.llenarpartidosFinalizados();
            this.llenarpartidosProximos();    
        }
        this.setState({refreshing:false});
    }

    selectLeagues=(value,key)=>{
        try {
        this.setState({leagueSelect:value},()=>{})
        var equipo=this.state.equipos[key]
        this.setState({equipo:equipo},()=>{this.handleRefresh()})
            
        } catch (error) {
            this.setState({mensajeSnackBar: "Tu liga todavía no tiene equipos"})
            this.setState({visibleSnackBar: true});
        }    
    }

    obtenerLigas=()=>{
        var user = firebase.auth().currentUser;
        var db=firebase.firestore();
        var ligas=[];
        var ligasMaster=[];
        var nombreLiga=[];
        var equipos=[];
        db.collection("usuarios").doc(user.uid).get().then((doc)=>{
            var data = doc.data();
            ligas = data.ligas;
            equipos=data.Equipos;
            for(let i=0;i<ligas.length;i++){
            db.collection("ligas").doc(ligas[i]).get().then((doc)=>{
                var data=doc.data();
                nombreLiga.push(data.Nombre)
                //console.log(nombreLiga)
                //console.log(this.state.nleagueSelect)
                ligasMaster.push({value:ligas[i],label:nombreLiga[i],color:'black',key:i})
                this.setState({ligasMaster:ligasMaster},()=>{})
                this.setState({equipos:equipos},()=>{})
                //this.setState({leagueSelect:ligas[0]},()=>{})
                //this.setState({nleagueSelect:nombreLiga[0]},()=>{})
                //this.setState({equipo:equipos[0]},()=>{})
            })
            .catch((error)=> {
                this.setState({mensajeSnackBar: "Hubo un error al obtener tus ligas"})
                this.setState({visibleSnackBar: true});
            });
        }})
        .catch((error)=> {
            this.setState({mensajeSnackBar: "Hubo un error al obtener tus ligas"})
            this.setState({visibleSnackBar: true});
        });
    }
    
    showDialog=()=>{
        this.setState({visible:true})
    }

    hideDialog=()=>{
        this.setState({visible:false})
    }

    llenarpartidosEquipo=()=>{
        var db = firebase.firestore()
        //aqui guardare la seleccion de la liga
        var liga = this.state.leagueSelect
        //aqui guardare el equipo del usuario
        var equipo = this.state.equipo
        let matchArray=[];
        db.collection("ligas").doc(liga).collection("equipos").doc(equipo).get().then((doc)=>{
            var infoEquipo = doc.data();
            var partidosEquipo = infoEquipo.Partidos;
            if(partidosEquipo[0] != ''){
            for(let i = 0; i<partidosEquipo.length;i++){
                db.collection("ligas").doc(liga).collection("partidos").doc(partidosEquipo[i]).get().then((doc)=>{
                    if(doc.exists){
                    let datapartido = doc.data();
                    let equipoF=datapartido.equipoF
                    db.collection("ligas").doc(liga).collection("equipos").doc(equipoF).get().then((doc)=>{
                        var dataEquipo = doc.data();
                        var nombreEquipoF = dataEquipo.Nombre;
                        let equipoV=datapartido.equipoV
                    db.collection("ligas").doc(liga).collection("equipos").doc(equipoV).get().then((doc)=>{
                        var dataEquipo = doc.data();
                        var nombreEquipoV = dataEquipo.Nombre;
                        let fecha=datapartido.fechaPartido
                        let golesF=datapartido.golesequipoF
                        let golesV=datapartido.golesequipoV
                        let completado=datapartido.completado
                        
                        var date=new Date(fecha.seconds*1000)
                        var dia=date.getDate()
                        var mes=date.getMonth()+1
                        var año=date.getFullYear()

                        var hora=date.getHours()
                        var minutos=date.getMinutes()

                        var stringDate= (dia+"/"+mes+"/"+año+" "+hora+":"+minutos)
                        matchArray.push({equipoV,equipoF,nombreEquipoF,nombreEquipoV,stringDate,golesF,golesV,completado});
                        this.setState({matchTeam:matchArray}, () => {});
                    })
                })
                }else{
                    this.setState({mensajeSnackBar: "Tu equipo todavía no tiene partidos"})
                    this.setState({visibleSnackBar: true});
                }
            })
            }   
            }
        else{
            this.setState({mensajeSnackBar: "Tu equipo todavía no tiene partidos"})
            this.setState({visibleSnackBar: true});
        }})
        .catch((error)=> {
        this.setState({mensajeSnackBar: "Tu equipo todavía no tiene partidos"})
        this.setState({visibleSnackBar: true});
        });
    }

    llenarpartidosFinalizados(){
        var db = firebase.firestore()
        //aqui guardare la seleccion de la liga
        var liga = this.state.leagueSelect
        let matchArray=[];
        db.collection("ligas").doc(liga).collection("partidos").where("completado", "==", true).orderBy("fechaPartido").get().then(querySnapshot=>{
            querySnapshot.forEach((doc)=>{

                let datapartido = doc.data();
                let equipoF=datapartido.equipoF
                db.collection("ligas").doc(liga).collection("equipos").doc(equipoF).get().then((doc)=>{
                    var dataEquipo = doc.data();
                    var nombreEquipoF = dataEquipo.Nombre;
                let equipoV=datapartido.equipoV
                db.collection("ligas").doc(liga).collection("equipos").doc(equipoV).get().then((doc)=>{
                    var dataEquipo = doc.data();
                    var nombreEquipoV = dataEquipo.Nombre;
                let fecha=datapartido.fechaPartido
                let golesF=datapartido.golesequipoF
                let golesV=datapartido.golesequipoV
                let completado=datapartido.completado

                var date=new Date(fecha.seconds*1000)
                    var dia=date.getDate()
                    var mes=date.getMonth()+1
                    var año=date.getFullYear()

                    var hora=date.getHours()
                    var minutos=date.getMinutes()

                    var stringDate= (dia+"/"+mes+"/"+año+" "+hora+":"+minutos)
                matchArray.push({nombreEquipoF,nombreEquipoV,stringDate,golesF,golesV,completado});
                this.setState({matchFinish:matchArray}, () => {
                });
            }).catch((error)=> {
                this.setState({mensajeSnackBar: "Tu liga todavía no tiene partidos finalizados"})
                this.setState({visibleSnackBar: true});
            });
        }).catch((error)=> {
            this.setState({mensajeSnackBar: "Tu liga todavía no tiene partidos finalizados"})
            this.setState({visibleSnackBar: true});
        });
    })
    })
    }

    llenarpartidosProximos(){
        var db = firebase.firestore()
        //aqui guardare la seleccion de la liga
        var liga = this.state.leagueSelect
        let matchArray=[];
        db.collection("ligas").doc(liga).collection("partidos").where("completado", "==", false).orderBy("fechaPartido").get().then(querySnapshot=>{
            querySnapshot.forEach((doc)=>{
                let datapartido = doc.data();
                let equipoF=datapartido.equipoF
                db.collection("ligas").doc(liga).collection("equipos").doc(equipoF).get().then((doc)=>{
                    var dataEquipo = doc.data();
                    var nombreEquipoF = dataEquipo.Nombre;
                
                let equipoV=datapartido.equipoV
                db.collection("ligas").doc(liga).collection("equipos").doc(equipoV).get().then((doc)=>{
                    var dataEquipo = doc.data();
                    var nombreEquipoV = dataEquipo.Nombre;
                let fecha=datapartido.fechaPartido
                let golesF=datapartido.golesequipoF
                let golesV=datapartido.golesequipoV
                let completado=datapartido.completado

                var date=new Date(fecha.seconds*1000)
                    var dia=date.getDate()
                    var mes=date.getMonth()+1
                    var año=date.getFullYear()

                    var hora=date.getHours()
                    var minutos=date.getMinutes()

                    var stringDate= (dia+"/"+mes+"/"+año+" "+hora+":"+minutos)

                matchArray.push({nombreEquipoF,nombreEquipoV,stringDate,golesF,golesV,completado});
                this.setState({matchNext:matchArray}, () => {
                })
                }).catch((error)=> {
                    this.setState({mensajeSnackBar: "Tu liga todavía no tiene partidos proximos"})
                    this.setState({visibleSnackBar: true});
                });
                }).catch((error)=> {
                    this.setState({mensajeSnackBar: "Tu liga todavía no tiene partidos proximos"})
                    this.setState({visibleSnackBar: true});
                });
                
            })
        }).catch((error)=> {
            this.setState({mensajeSnackBar: "Tu liga todavía no tiene partidos proximos"})
            this.setState({visibleSnackBar: true});
        });
    }

    dismissSnackbar=()=>{
        this.setState({
            visibleSnackBar:false
        })
    }

    _renderScene=({route})=>{
        switch (route.key){
            case 'first': return <Games  handleRefresh={this.handleRefresh} refreshing={this.state.refreshing} visible={this.state.visible} hideDialog={this.hideDialog} showDialog={this.showDialog} team={this.state.matchNext}/>
            case 'second': return <Games handleRefresh={this.handleRefresh} refreshing={this.state.refreshing} visible={this.state.visible} hideDialog={this.hideDialog} showDialog={this.showDialog} team={this.state.matchFinish}/>
            case 'third': return <Games  handleRefresh={this.handleRefresh} refreshing={this.state.refreshing} visible={this.state.visible} hideDialog={this.hideDialog} showDialog={this.showDialog} team={this.state.matchTeam}></Games>
        }
    }
    


    render(){
        return(
            <View style={{flex:1}}>
                <Header ligasMaster={this.state.ligasMaster} leagueSelect={this.state.leagueSelect} nleagueSelect={this.state.nleagueSelect} selectLeagues={this.selectLeagues} tit={this.state.title}></Header>              
            <TabView
            navigationState={this.state}
            renderScene={this._renderScene}
            onIndexChange={index => this.setState({ index })}
            initialLayout={{ width: Dimensions.get('window').width }}
            renderTabBar={props=><TabBar {...props} indicatorStyle={{ backgroundColor: '#47C9C6' }}
            labelStyle={{color:'#47C9C6',fontWeight:'bold'}}
            style={{ paddingTop:10,backgroundColor: '#FAFAFA' }}></TabBar>}
            />
            <SnackBars
               mensajeSnackBar= {this.state.mensajeSnackBar}
               visibleSnackBar={this.state.visibleSnackBar}
               dismissSnackbar = {this.dismissSnackbar}
            ></SnackBars>

            </View>
        );
    }
}