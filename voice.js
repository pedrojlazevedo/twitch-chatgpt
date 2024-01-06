let is_enabled = false;
let voces = [];
let speech_pendientes = [];
let estados = {
  "sad": {
    pitch: .5,
    rate: .4
  },
  "happy": {
    pitch: 1.5,
    rate: 2
  },
  "default":{
    pitch: 1,
    rate: 1
  }
}

const cb_enabled = true // document.getElementById('tts_enabled');
const select_voces_m = document.getElementById('selected_voice_male');
const select_voces_f = document.getElementById('selected_voice_female');

select_voces_m.onchange = select_voces_f.onchange = function( ){
  const voces_seleccionadas = {
    m: select_voces_m.options[ select_voces_m.selectedIndex ].innerHTML,
    f: select_voces_f.options[ select_voces_f.selectedIndex ].innerHTML
  }
  localStorage.setItem( 'tts_voces', JSON.stringify(voces_seleccionadas) );
}

const btn_cancel = document.getElementById('cancel_speech');


cb_enabled.addEventListener('click', e => {
  is_enabled = cb_enabled.checked;
  if(is_enabled) check_pendientes( );
} );

btn_cancel.addEventListener('click', e => {
  speechSynthesis.cancel( );
} );

function talk( chat_message, voz = 'm', estado = 'default' ){
  speech_pendientes.push( {
    msg: chat_message,
    voice: voz,
    config: estado
  } );
  check_pendientes( );
}

function check_pendientes( ){
  if( is_enabled && speech_pendientes.length ){
    const pendiente = speech_pendientes.shift( );
    send_voice( pendiente.msg, pendiente.voice, pendiente.config );
  }
}

function send_voice( chat_message, voz = 'm', animo = 'default' ){
  const locucion = new SpeechSynthesisUtterance( chat_message );
  const estado = estados[animo] ?? estados['default'];
  locucion.rate = estado.rate; //velocidad
  locucion.pitch = estado.pitch; //tono
  locucion.voice = voz == 'm' ?
      voces[ select_voces_m.value ]:
      voces[ select_voces_f.value ];

  speechSynthesis.speak( locucion );
  locucion.onend = function( ){
    check_pendientes( );
  }
}

function getVoices( ){
  voces = speechSynthesis.getVoices( );
  let voces_guardadas = localStorage.getItem('tts_voces') ?
      JSON.parse( localStorage.getItem('tts_voces') ) :
      { "m": "", "f": "" };


  voces.map( (v, index) => {
    //cargar el combo para elegir voz masculina
    const option = document.createElement('option');
    option.value = index;
    if( `${v.name} (${v.lang})` == voces_guardadas.m ){
      option.selected = true;
    }
    option.innerHTML = `${v.name} (${v.lang})`;
    select_voces_m.appendChild(option);

    //cargar combo para elegir voz femenina
    const option2 = document.createElement('option');
    option2.value = index;
    if( `${v.name} (${v.lang})` == voces_guardadas.f ){
      option2.selected = true;
    }
    option2.innerHTML = `${v.name} (${v.lang})`;
    select_voces_f.appendChild(option2);
  } );
}

getVoices( );
speechSynthesis.onvoiceschanged = getVoices;

export { talk };