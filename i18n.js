(() => {
  const LANG_KEY = 'bvs_lang_v1';
  const supported = ['en','pt','es','fr','it','de'];
  const labels = {en:'English',pt:'Português',es:'Español',fr:'Français',it:'Italiano',de:'Deutsch'};

  const T = {
    pt: {
      'Skip to main content':'Pular para o conteúdo principal','A structured supplement routine':'Uma rotina estruturada de suplementos','Bioavailability • Vitality • Synergy':'Biodisponibilidade • Vitalidade • Sinergia','A simple way to organise supplement timing, hydration, adherence and review in one daily routine.':'Uma forma simples de organizar horários dos suplementos, hidratação, adesão e revisão em uma única rotina diária.','Open My BVS Day':'Abrir meu dia BVS','Explore B / V / S':'Explorar B / V / S','My Day':'Meu dia','Calendar':'Calendário','Profile':'Perfil','Reset demo':'Reiniciar demonstração','Today':'Hoje','My BVS Day':'Meu dia BVS','See what is due, record each supplement, and keep an eye on your hydration target.':'Veja o que está programado, registre cada suplemento e acompanhe sua meta de hidratação.','Bioavailability':'Biodisponibilidade','Vitality':'Vitalidade','Synergy':'Sinergia','Foundation':'Base','Builds on B':'Continua o estágio B','Complete routine':'Rotina completa','Stage':'Estágio','Taken today':'Tomados hoje','Water':'Água','Completion':'Conclusão','Today\'s routine':'Rotina de hoje','Hydration':'Hidratação','Daily water target':'Meta diária de água','BVS uses a stage-based target as a simple routine. If a clinician has advised fluid restriction or another target, that individual advice takes priority.':'O BVS usa uma meta baseada no estágio como rotina simples. Se um profissional de saúde recomendou restrição de líquidos ou outra meta, essa orientação individual tem prioridade.','litre':'litro','Monthly adherence':'Adesão mensal','Your whole month,\nat a glance.':'Seu mês inteiro,\nem um relance.','Each day is marked as complete, partial or missed based on the routine recorded in this browser.':'Cada dia é marcado como completo, parcial ou perdido com base na rotina registrada neste navegador.','Complete':'Completo','Partial':'Parcial','Missed':'Perdido','B / V / S system':'Sistema B / V / S','What each stage includes.':'O que cada estágio inclui.','The routine below explains why each supplement is included and the intended timing. It is general educational information, not a prescription.':'A rotina abaixo explica por que cada suplemento está incluído e o horário pretendido. É informação educativa geral, não uma prescrição.','Safety note:':'Nota de segurança:','Supplements can interact with medicines and may not be suitable for everyone. Check the product label and seek pharmacist or clinician advice if you take prescription medicines, have a medical condition, are pregnant, or have been advised to restrict fluids.':'Suplementos podem interagir com medicamentos e podem não ser adequados para todos. Verifique o rótulo e procure orientação de um farmacêutico ou profissional de saúde se usa medicamentos prescritos, tem alguma condição médica, está grávida ou recebeu orientação para restringir líquidos.','Personal settings':'Configurações pessoais','Keep the routine simple.':'Mantenha a rotina simples.','Your name and chosen BVS stage are stored only in this browser in this prototype.':'Seu nome e o estágio BVS escolhido ficam armazenados apenas neste navegador neste protótipo.','Name / identifier':'Nome / identificador','BVS stage':'Estágio BVS','Save profile':'Salvar perfil','Coming next':'A seguir','Recommended supplements':'Suplementos recomendados','As an Amazon Associate, BVS Protocol may earn from qualifying purchases.':'Como associado da Amazon, o BVS Protocol pode receber comissão por compras qualificadas.','Educational wellness-planning prototype. It does not diagnose, treat or replace medical advice.':'Protótipo educativo de planejamento de bem-estar. Não diagnostica, trata nem substitui orientação médica.','Shop Recommended Supplements':'Comprar suplementos recomendados','Shop':'Loja','BVS Shop':'Loja BVS','Shop the BVS Protocol.':'Compre o BVS Protocol.','Products selected to match each stage of the BVS routine. Choose your stage or shop individual supplements.':'Produtos selecionados para cada estágio da rotina BVS. Escolha seu estágio ou compre suplementos individualmente.','All products':'Todos os produtos','Foundation products for the B stage.':'Produtos base para o estágio B.','Everything in B, plus CoQ10 and Omega-3.':'Tudo do B, mais CoQ10 e Ômega-3.','The complete routine, including creatine.':'A rotina completa, incluindo creatina.','Included routine':'Rotina incluída','Water routine':'Rotina de água','Why:':'Por quê:','Taken':'Tomado','Undo':'Desfazer','No record':'Sem registro','water target:':'meta de água:','marked taken':'marcado como tomado','marked missed':'marcado como perdido','mL recorded':'mL registrados','Profile saved':'Perfil salvo','Demo reset':'Demonstração reiniciada','Reset all BVS records stored in this browser?':'Reiniciar todos os registros BVS armazenados neste navegador?','Sun':'Dom','Mon':'Seg','Tue':'Ter','Wed':'Qua','Thu':'Qui','Fri':'Sex','Sat':'Sáb','January':'Janeiro','February':'Fevereiro','March':'Março','April':'Abril','May':'Maio','June':'Junho','July':'Julho','August':'Agosto','September':'Setembro','October':'Outubro','November':'Novembro','December':'Dezembro'
    },
    es: {
      'Skip to main content':'Saltar al contenido principal','A structured supplement routine':'Una rutina estructurada de suplementos','Bioavailability • Vitality • Synergy':'Biodisponibilidad • Vitalidad • Sinergia','A simple way to organise supplement timing, hydration, adherence and review in one daily routine.':'Una forma sencilla de organizar horarios de suplementos, hidratación, adherencia y revisión en una sola rutina diaria.','Open My BVS Day':'Abrir mi día BVS','Explore B / V / S':'Explorar B / V / S','My Day':'Mi día','Calendar':'Calendario','Profile':'Perfil','Reset demo':'Reiniciar demo','Today':'Hoy','My BVS Day':'Mi día BVS','See what is due, record each supplement, and keep an eye on your hydration target.':'Consulta lo programado, registra cada suplemento y controla tu objetivo de hidratación.','Bioavailability':'Biodisponibilidad','Vitality':'Vitalidad','Synergy':'Sinergia','Foundation':'Base','Builds on B':'Continúa B','Complete routine':'Rutina completa','Stage':'Etapa','Taken today':'Tomados hoy','Water':'Agua','Completion':'Progreso','Today\'s routine':'Rutina de hoy','Hydration':'Hidratación','Daily water target':'Objetivo diario de agua','litre':'litro','Monthly adherence':'Adherencia mensual','Your whole month,\nat a glance.':'Todo tu mes,\nde un vistazo.','Complete':'Completo','Partial':'Parcial','Missed':'Omitido','B / V / S system':'Sistema B / V / S','What each stage includes.':'Qué incluye cada etapa.','Safety note:':'Nota de seguridad:','Personal settings':'Ajustes personales','Keep the routine simple.':'Mantén la rutina simple.','Name / identifier':'Nombre / identificador','BVS stage':'Etapa BVS','Save profile':'Guardar perfil','Recommended supplements':'Suplementos recomendados','As an Amazon Associate, BVS Protocol may earn from qualifying purchases.':'Como afiliado de Amazon, BVS Protocol puede recibir una comisión por compras que cumplan los requisitos.','Shop Recommended Supplements':'Comprar suplementos recomendados','Shop':'Tienda','BVS Shop':'Tienda BVS','Shop the BVS Protocol.':'Compra el BVS Protocol.','All products':'Todos los productos','Included routine':'Rutina incluida','Water routine':'Rutina de agua','Why:':'Por qué:','Taken':'Tomado','Undo':'Deshacer','No record':'Sin registro','water target:':'objetivo de agua:','Profile saved':'Perfil guardado','Demo reset':'Demo reiniciada','Sun':'Dom','Mon':'Lun','Tue':'Mar','Wed':'Mié','Thu':'Jue','Fri':'Vie','Sat':'Sáb','January':'Enero','February':'Febrero','March':'Marzo','April':'Abril','May':'Mayo','June':'Junio','July':'Julio','August':'Agosto','September':'Septiembre','October':'Octubre','November':'Noviembre','December':'Diciembre'
    },
    fr: {
      'A structured supplement routine':'Une routine structurée de compléments','Bioavailability • Vitality • Synergy':'Biodisponibilité • Vitalité • Synergie','Open My BVS Day':'Ouvrir ma journée BVS','Explore B / V / S':'Explorer B / V / S','My Day':'Ma journée','Calendar':'Calendrier','Profile':'Profil','Reset demo':'Réinitialiser la démo','Today':'Aujourd’hui','My BVS Day':'Ma journée BVS','Bioavailability':'Biodisponibilité','Vitality':'Vitalité','Synergy':'Synergie','Foundation':'Base','Builds on B':'S’appuie sur B','Complete routine':'Routine complète','Stage':'Étape','Taken today':'Pris aujourd’hui','Water':'Eau','Completion':'Progression','Today\'s routine':'Routine du jour','Hydration':'Hydratation','Daily water target':'Objectif quotidien d’eau','litre':'litre','Monthly adherence':'Suivi mensuel','Complete':'Complet','Partial':'Partiel','Missed':'Manqué','What each stage includes.':'Ce que comprend chaque étape.','Safety note:':'Note de sécurité :','Personal settings':'Paramètres personnels','Keep the routine simple.':'Gardez la routine simple.','Name / identifier':'Nom / identifiant','BVS stage':'Étape BVS','Save profile':'Enregistrer le profil','Recommended supplements':'Compléments recommandés','Shop Recommended Supplements':'Acheter les compléments recommandés','Shop':'Boutique','BVS Shop':'Boutique BVS','Shop the BVS Protocol.':'Acheter le protocole BVS.','All products':'Tous les produits','Included routine':'Routine incluse','Water routine':'Routine d’eau','Why:':'Pourquoi :','Taken':'Pris','Undo':'Annuler','No record':'Aucun enregistrement','water target:':'objectif d’eau :','Profile saved':'Profil enregistré','Demo reset':'Démo réinitialisée','Sun':'Dim','Mon':'Lun','Tue':'Mar','Wed':'Mer','Thu':'Jeu','Fri':'Ven','Sat':'Sam','January':'Janvier','February':'Février','March':'Mars','April':'Avril','May':'Mai','June':'Juin','July':'Juillet','August':'Août','September':'Septembre','October':'Octobre','November':'Novembre','December':'Décembre'
    },
    it: {
      'A structured supplement routine':'Una routine strutturata di integratori','Bioavailability • Vitality • Synergy':'Biodisponibilità • Vitalità • Sinergia','Open My BVS Day':'Apri la mia giornata BVS','Explore B / V / S':'Esplora B / V / S','My Day':'La mia giornata','Calendar':'Calendario','Profile':'Profilo','Reset demo':'Reimposta demo','Today':'Oggi','My BVS Day':'La mia giornata BVS','Bioavailability':'Biodisponibilità','Vitality':'Vitalità','Synergy':'Sinergia','Foundation':'Base','Builds on B':'Si basa su B','Complete routine':'Routine completa','Stage':'Fase','Taken today':'Assunti oggi','Water':'Acqua','Completion':'Completamento','Today\'s routine':'Routine di oggi','Hydration':'Idratazione','Daily water target':'Obiettivo giornaliero di acqua','litre':'litro','Monthly adherence':'Aderenza mensile','Complete':'Completo','Partial':'Parziale','Missed':'Saltato','What each stage includes.':'Cosa comprende ogni fase.','Safety note:':'Nota di sicurezza:','Personal settings':'Impostazioni personali','Keep the routine simple.':'Mantieni la routine semplice.','Name / identifier':'Nome / identificativo','BVS stage':'Fase BVS','Save profile':'Salva profilo','Recommended supplements':'Integratori consigliati','Shop Recommended Supplements':'Acquista integratori consigliati','Shop':'Negozio','BVS Shop':'Negozio BVS','Shop the BVS Protocol.':'Acquista il protocollo BVS.','All products':'Tutti i prodotti','Included routine':'Routine inclusa','Water routine':'Routine acqua','Why:':'Perché:','Taken':'Assunto','Undo':'Annulla','No record':'Nessun dato','water target:':'obiettivo acqua:','Profile saved':'Profilo salvato','Demo reset':'Demo reimpostata','Sun':'Dom','Mon':'Lun','Tue':'Mar','Wed':'Mer','Thu':'Gio','Fri':'Ven','Sat':'Sab','January':'Gennaio','February':'Febbraio','March':'Marzo','April':'Aprile','May':'Maggio','June':'Giugno','July':'Luglio','August':'Agosto','September':'Settembre','October':'Ottobre','November':'Novembre','December':'Dicembre'
    },
    de: {
      'A structured supplement routine':'Eine strukturierte Supplement-Routine','Bioavailability • Vitality • Synergy':'Bioverfügbarkeit • Vitalität • Synergie','Open My BVS Day':'Meinen BVS-Tag öffnen','Explore B / V / S':'B / V / S erkunden','My Day':'Mein Tag','Calendar':'Kalender','Profile':'Profil','Reset demo':'Demo zurücksetzen','Today':'Heute','My BVS Day':'Mein BVS-Tag','Bioavailability':'Bioverfügbarkeit','Vitality':'Vitalität','Synergy':'Synergie','Foundation':'Grundlage','Builds on B':'Baut auf B auf','Complete routine':'Komplette Routine','Stage':'Stufe','Taken today':'Heute genommen','Water':'Wasser','Completion':'Fortschritt','Today\'s routine':'Heutige Routine','Hydration':'Hydration','Daily water target':'Tägliches Wasserziel','litre':'Liter','Monthly adherence':'Monatliche Einhaltung','Complete':'Vollständig','Partial':'Teilweise','Missed':'Verpasst','What each stage includes.':'Was jede Stufe umfasst.','Safety note:':'Sicherheitshinweis:','Personal settings':'Persönliche Einstellungen','Keep the routine simple.':'Halte die Routine einfach.','Name / identifier':'Name / Kennung','BVS stage':'BVS-Stufe','Save profile':'Profil speichern','Recommended supplements':'Empfohlene Supplements','Shop Recommended Supplements':'Empfohlene Supplements kaufen','Shop':'Shop','BVS Shop':'BVS Shop','Shop the BVS Protocol.':'BVS Protocol kaufen.','All products':'Alle Produkte','Included routine':'Enthaltene Routine','Water routine':'Wasserroutine','Why:':'Warum:','Taken':'Genommen','Undo':'Rückgängig','No record':'Kein Eintrag','water target:':'Wasserziel:','Profile saved':'Profil gespeichert','Demo reset':'Demo zurückgesetzt','Sun':'So','Mon':'Mo','Tue':'Di','Wed':'Mi','Thu':'Do','Fri':'Fr','Sat':'Sa','January':'Januar','February':'Februar','March':'März','April':'April','May':'Mai','June':'Juni','July':'Juli','August':'August','September':'September','October':'Oktober','November':'November','December':'Dezember'
    }
  };

  let current = 'en';
  let applying = false;

  function detect(){
    const saved = localStorage.getItem(LANG_KEY);
    if (supported.includes(saved)) return saved;
    const n = (navigator.language || 'en').slice(0,2).toLowerCase();
    return supported.includes(n) ? n : 'en';
  }

  function translateString(input, lang){
    if (lang === 'en' || !T[lang]) return input;
    let out = input;
    const entries = Object.entries(T[lang]).sort((a,b)=>b[0].length-a[0].length);
    for (const [en,tr] of entries) if (out.includes(en)) out = out.split(en).join(tr);
    return out;
  }

  function translateNode(node){
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.__bvsOriginal) node.__bvsOriginal = node.nodeValue;
      node.nodeValue = translateString(node.__bvsOriginal, current);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.id === 'bvsLanguageBox' || node.closest?.('#bvsLanguageBox')) return;
    if (node.hasAttribute('aria-label')) {
      if (!node.__bvsAriaOriginal) node.__bvsAriaOriginal = node.getAttribute('aria-label');
      node.setAttribute('aria-label', translateString(node.__bvsAriaOriginal, current));
    }
    node.childNodes.forEach(translateNode);
  }

  function apply(lang){
    current = supported.includes(lang) ? lang : 'en';
    localStorage.setItem(LANG_KEY,current);
    document.documentElement.lang = current === 'pt' ? 'pt-BR' : current;
    applying = true;
    translateNode(document.body);
    const sel = document.getElementById('bvsLangSelect');
    if (sel) sel.value = current;
    applying = false;
  }

  function injectSelector(){
    if (document.getElementById('bvsLanguageBox')) return;
    const box = document.createElement('div');
    box.id='bvsLanguageBox';
    box.innerHTML=`<label for="bvsLangSelect" style="position:absolute;left:-9999px">Language</label><select id="bvsLangSelect" aria-label="Language">${supported.map(l=>`<option value="${l}">${labels[l]}</option>`).join('')}</select>`;
    Object.assign(box.style,{position:'fixed',right:'12px',top:'12px',zIndex:'200',padding:'7px',border:'1px solid rgba(216,239,248,.25)',borderRadius:'14px',background:'rgba(2,8,14,.90)',backdropFilter:'blur(14px)',boxShadow:'0 10px 30px rgba(0,0,0,.25)'});
    const sel=box.querySelector('select');
    Object.assign(sel.style,{minHeight:'38px',width:'auto',borderRadius:'10px',padding:'6px 10px',background:'#071725',color:'#fff',border:'1px solid rgba(216,239,248,.20)'});
    sel.addEventListener('change',e=>apply(e.target.value));
    document.body.appendChild(box);
  }

  injectSelector();
  apply(detect());

  const obs = new MutationObserver(mutations => {
    if (applying) return;
    applying = true;
    for (const m of mutations) {
      if (m.type === 'childList') m.addedNodes.forEach(n=>translateNode(n));
      else if (m.type === 'characterData') translateNode(m.target);
    }
    applying = false;
  });
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
