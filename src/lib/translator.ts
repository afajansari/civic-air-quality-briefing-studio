/**
 * Civic Air Quality Briefing Studio - Multilingual & Multi-Reading Level Engine
 * Languages: English, Hindi (हिंदी), Spanish (Español), Marathi (मराठी), Tamil (தமிழ்), Bengali (বাংলা)
 * Reading Levels: Simple (Grade 6), General Public, Sensitive Groups
 * Dedicated Focus: Children, Older Adults, Sensitive Individuals
 */

import { CitizenAdvisory, LanguageCode, ParsedDataSet, ReadingLevel } from '../types';

export const LOCALIZED_LABELS: Record<string, {
  language: string;
  title: string;
  emergencyNotice: string;
  currentStatus: string;
  dominantPollutant: string;
  keyFindings: string;
  readingLevels: Record<ReadingLevel, string>;
  sections: {
    children: string;
    seniors: string;
    sensitive: string;
    actions: string;
    dos: string;
    donts: string;
  };
}> = {
  en: {
    language: 'English',
    title: 'Citizen Air Quality Advisory',
    emergencyNotice: 'AIR QUALITY HEALTH ALERT',
    currentStatus: 'Current Air Quality Status',
    dominantPollutant: 'Primary Pollutant',
    keyFindings: 'Key Findings',
    readingLevels: {
      simple: 'Simple / Everyday Language (Grade 6)',
      general: 'General Public Community Advisory',
      sensitive: 'High-Alert Sensitive Group Protocol'
    },
    sections: {
      children: 'Extra Care for Children & Schools',
      seniors: 'Protective Advice for Older Adults & Seniors',
      sensitive: 'High-Risk Guidance for Asthma, Heart & Lung Patients',
      actions: 'Recommended Immediate Actions',
      dos: 'What To Do',
      donts: 'What To Avoid'
    }
  },
  hi: {
    language: 'Hindi (हिंदी)',
    title: 'नागरिक वायु गुणवत्ता परामर्श (Citizen Advisory)',
    emergencyNotice: 'वायु गुणवत्ता स्वास्थ्य चेतावनी',
    currentStatus: 'वर्तमान वायु गुणवत्ता स्थिति',
    dominantPollutant: 'प्रमुख प्रदूषक',
    keyFindings: 'मुख्य निष्कर्ष',
    readingLevels: {
      simple: 'सरल एवं सामान्य बोलचाल की भाषा',
      general: 'सामान्य जन परामर्श',
      sensitive: 'संवेदनशील समूहों के लिए विशेष दिशा-निर्देश'
    },
    sections: {
      children: 'बच्चों एवं विद्यालयों के लिए विशेष सावधानी',
      seniors: 'वरिष्ठ नागरिकों और बुजुर्गों के लिए सुरक्षा सलाह',
      sensitive: 'अस्थमा, सांस व हृदय रोगियों के लिए आपातकालीन मार्गदर्शन',
      actions: 'तत्काल अनुशंसित कदम',
      dos: 'क्या करें (ज़रूरी कदम)',
      donts: 'क्या न करें (बचने योग्य बातें)'
    }
  },
  es: {
    language: 'Spanish (Español)',
    title: 'Aviso Ciudadano de Calidad del Aire',
    emergencyNotice: 'ALERTA DE SALUD POR CALIDAD DEL AIRE',
    currentStatus: 'Estado Actual de la Calidad del Aire',
    dominantPollutant: 'Contaminante Principal',
    keyFindings: 'Hallazgos Clave',
    readingLevels: {
      simple: 'Lenguaje Sencillo y Cotidiano',
      general: 'Aviso para la Comunidad en General',
      sensitive: 'Protocolo de Alta Alerta para Grupos Sensibles'
    },
    sections: {
      children: 'Cuidado Especial para Niños y Escuelas',
      seniors: 'Consejos de Protección para Adultos Mayores',
      sensitive: 'Guía de Alto Riesgo para Pacientes con Asma y Problemas Cardíacos',
      actions: 'Acciones Inmediatas Recomendadas',
      dos: 'Qué Hacer',
      donts: 'Qué Evitar'
    }
  },
  mr: {
    language: 'Marathi (मराठी)',
    title: 'नागरी हवा गुणवत्ता सूचना व सल्ला',
    emergencyNotice: 'हवा गुणवत्ता आरोग्य इशारा',
    currentStatus: 'सद्य हवेची गुणवत्ता',
    dominantPollutant: 'प्रमुख प्रदूषक',
    keyFindings: 'महत्त्वाचे निष्कर्ष',
    readingLevels: {
      simple: 'सोपी आणि दैनंदिन भाषा',
      general: 'सर्वसामान्य जनतेसाठी सल्ला',
      sensitive: 'अतिसंवेदनशील गटांसाठी विशेष नियमावली'
    },
    sections: {
      children: 'शालेय मुले आणि लहान मुलांची विशेष काळजी',
      seniors: 'ज्येष्ठ नागरिकांसाठी आरोग्य सुरक्षा',
      sensitive: 'दमा, श्वसन आणि हृदयविकार असलेल्या व्यक्तींसाठी मार्गदर्शन',
      actions: 'तातडीने करावयाची कृती',
      dos: 'काय करावे',
      donts: 'काय टाळावे'
    }
  },
  ta: {
    language: 'Tamil (தமிழ்)',
    title: 'குடிமக்கள் காற்றுத் தரம் மற்றும் சுகாதார ஆலோசனை',
    emergencyNotice: 'காற்றுத் தர சுகாதார எச்சரிக்கை',
    currentStatus: 'தற்போதைய காற்றுத் தரம்',
    dominantPollutant: 'முக்கிய மாசு காரணி',
    keyFindings: 'முக்கிய கண்டுபிடிப்புகள்',
    readingLevels: {
      simple: 'எளிய பொது மொழி',
      general: 'பொதுமக்கள் ஆலோசனை',
      sensitive: 'உணர்திறன் கொண்டவர்களுக்கான வழிகாட்டுதல்'
    },
    sections: {
      children: 'குழந்தைகள் மற்றும் பள்ளிகளுக்கான சிறப்பு பாதுகாப்பு',
      seniors: 'மூத்த குடிமக்களுக்கான பாதுகாப்பு அறிவுரைகள்',
      sensitive: 'ஆஸ்துமா மற்றும் இதய நோயாளிகளுக்கான அவசர குறிப்புகள்',
      actions: 'பரிந்துரைக்கப்பட்ட உடனடி நடவடிக்கைகள்',
      dos: 'செய்ய வேண்டியவை',
      donts: 'தவிர்க்க வேண்டியவை'
    }
  },
  bn: {
    language: 'Bengali (বাংলা)',
    title: 'নাগরিক বায়ু মান ও স্বাস্থ্য পরামর্শ',
    emergencyNotice: 'বায়ু দূষণ জনস্বাস্থ্য সতর্কবার্তা',
    currentStatus: 'বর্তমান বাতাসের মান',
    dominantPollutant: 'প্রধান দূষণকারী উপাদান',
    keyFindings: 'মূল পর্যবেক্ষণসমূহ',
    readingLevels: {
      simple: 'সহজ ও বোধগম্য ভাষা',
      general: 'সাধারণ জনগণের জন্য নির্দেশিকা',
      sensitive: 'সংবেদনশীল জনগোষ্ঠীর জন্য বিশেষ সতর্কতা'
    },
    sections: {
      children: 'শিশু ও বিদ্যালয়ের জন্য বিশেষ সতর্কতা',
      seniors: 'বয়োজ্যেষ্ঠ নাগরিকদের জন্য স্বাস্থ্য সুরক্ষা',
      sensitive: 'অ্যাজমা, শ্বাসকষ্ট ও হৃদরোগীদের জরুরি পরামর্শ',
      actions: 'অবিলম্বে করণীয় পদক্ষেপ',
      dos: 'কী করবেন',
      donts: 'কী করবেন না'
    }
  }
};

export function generateLocalizedAdvisory(
  analysis: ParsedDataSet,
  lang: LanguageCode = 'en',
  readingLevel: ReadingLevel = 'general'
): CitizenAdvisory {
  const labels = LOCALIZED_LABELS[lang] || LOCALIZED_LABELS.en;
  const aqi = analysis.summary.averageAQI || 0;
  const peakAqi = analysis.summary.peakAQI || 0;
  const category = analysis.summary.category || 'Moderate';
  const dominant = analysis.summary.dominantPollutant || 'PM2.5';
  const peakLoc = analysis.summary.peakLocation || 'Local Ward';
  const peakTime = analysis.summary.peakTimestamp || 'Morning Peak';

  const isSevere = aqi > 300 || peakAqi > 350;
  const isPoor = aqi > 200;

  if (lang === 'hi') {
    return {
      language: 'Hindi',
      readingLevel,
      title: `${labels.title} - ${category}`,
      urgency: isSevere ? 'उच्चतम सतर्कता (Emergency)' : (isPoor ? 'चेतावनी (Warning)' : 'सूचना (Advisory)'),
      summary: readingLevel === 'simple'
        ? `आज हमारे इलाके की हवा काफी खराब है (AQI: ${aqi})। हवा में बारीक धूल-धुआं (${dominant}) बहुत अधिक है, जो सीधे फेफड़ों में जाता है। खासकर ${peakLoc} में सुबह ${peakTime} के दौरान हवा सबसे ज्यादा जहरीली दर्ज हुई। कृपया बेवजह घर से बाहर न निकलें और मास्क पहनें।`
        : `क्षेत्रीय वायु गुणवत्ता सूचकांक (AQI) वर्तमान में ${aqi} (${category}) पर दर्ज किया गया है। प्रमुख प्रदूषक तत्व ${dominant} है, जिसका उच्चतम स्तर ${peakLoc} पर ${peakTime} (पीक AQI ${peakAqi}) पर देखा गया। जनस्वास्थ्य सुरक्षा हेतु नागरिक दिशा-निर्देशों का पालन सुनिश्चित करें।`,
      sections: {
        children: {
          title: labels.sections.children,
          tips: [
            readingLevel === 'simple'
              ? 'सुबह के समय बच्चों को बाहर खेलने न भेजें।'
              : 'प्राथमिक एवं माध्यमिक विद्यालयों में प्रातःकालीन खेलकूद और बाहरी प्रार्थना सभाएं तत्काल स्थगित करें।',
            'स्कूल जाते समय बच्चों को अच्छी गुणवत्ता वाला N95 या 3-प्लाई मास्क अवश्य पहनाएं।',
            'जिन बच्चों को दमा या सांस की समस्या है, उनके इनहेलर हमेशा साथ रखें।'
          ]
        },
        seniors: {
          title: labels.sections.seniors,
          tips: [
            readingLevel === 'simple'
              ? 'दादा-दादी सुबह की सैर घर के अंदर ही करें, बाहर ठंड और धुंध में न जाएं।'
              : 'वरिष्ठ नागरिक सुबह 6 से 9 बजे के बीच बाहरी सैर से पूरी तरह बचें, क्योंकि इस समय प्रदूषण सतह पर जमा रहता है।',
            'हृदय या ब्लड प्रेशर की दवाएं नियमित रूप से लें और सीने में भारीपन होने पर तुरंत चिकित्सक से संपर्क करें।',
            'कमरे की खिड़कियां सुबह और देर शाम बंद रखें ताकि बाहर का धुआं अंदर न आए।'
          ]
        },
        sensitive: {
          title: labels.sections.sensitive,
          tips: [
            'अस्थमा और फेफड़ों के रोगी अपने प्रिवेंटिव इनहेलर की खुराक चिकित्सक के निर्देशानुसार तैयार रखें।',
            'घर के अंदर अगरबत्ती, धूपबत्ती या मच्छर मारने वाली कॉइल न जलाएं, क्योंकि इससे कमरे के भीतर का प्रदूषण कई गुना बढ़ जाता है।',
            'यदि बाहर जाना अत्यंत आवश्यक हो तो केवल N95 मास्क ही प्रभावी सुरक्षा प्रदान करता है।'
          ]
        },
        dos: [
          'पर्याप्त मात्रा में पानी और गुनगुने पेय पदार्थ पिएं ताकि गले की खराश से राहत मिले।',
          'घर के अंदर गीला पोछा लगाएं ताकि धूल न उड़े।',
          'घर के आसपास निर्माण कार्य या मलबे पर पानी का छिड़काव करें।'
        ],
        donts: [
          'सूखे पत्तों, कचरे या प्लास्टिक को खुले में कतई न जलाएं।',
          'सुबह और देर शाम भारी व्यायाम या दौड़ने से बचें।',
          'सड़कों पर बेवजह निजी डीजल वाहन निकालने से बचें; सार्वजनिक परिवहन को प्राथमिकता दें।'
        ]
      }
    };
  }

  if (lang === 'es') {
    return {
      language: 'Spanish',
      readingLevel,
      title: `${labels.title} - Nivel ${category}`,
      urgency: isSevere ? 'ALERTA MÁXIMA DE SALUD' : (isPoor ? 'ADVERTENCIA DE SALUD' : 'AVISO PREVENTIVO'),
      summary: readingLevel === 'simple'
        ? `El aire de nuestra comunidad no es saludable hoy (Índice AQI: ${aqi}). Hay demasiado polvo fino y humo (${dominant}) flotando en el aire. El punto más contaminado fue ${peakLoc} alrededor de las ${peakTime} (pico de ${peakAqi}). Protéjase y reduzca el tiempo al aire libre.`
        : `El monitoreo cívico registra un índice promedio de calidad del aire de ${aqi} (${category}), con ${dominant} como contaminante dominante. El pico más crítico se detectó en ${peakLoc} a las ${peakTime} alcanzando un AQI de ${peakAqi}. Se activan recomendaciones preventivas comunitarias.`,
      sections: {
        children: {
          title: labels.sections.children,
          tips: [
            readingLevel === 'simple'
              ? 'Los niños deben jugar bajo techo y evitar correr afuera mientras dure la alerta.'
              : 'Suspender clases de educación física y recreos al aire libre en colegios.',
            'Asegurar uso de mascarillas con filtro tipo N95 en traslados escolares.',
            'Monitorear de cerca a estudiantes con antecedentes de asma o alergias bronquiales.'
          ]
        },
        seniors: {
          title: labels.sections.seniors,
          tips: [
            'Evitar caminatas matutinas al aire libre durante las horas pico de contaminación.',
            'Mantener puertas y ventanas cerradas para evitar la intrusión de material particulado.',
            'Consultar de inmediato ante fatiga inhabitual, tos persistente o dificultad respiratoria.'
          ]
        },
        sensitive: {
          title: labels.sections.sensitive,
          tips: [
            'Personas con asma o EPOC deben tener sus broncodilatadores al alcance inmediato.',
            'Evitar encender velas, incienso o productos que desprendan humo en interiores.',
            'Utilizar purificadores de aire con filtro HEPA si están disponibles en el hogar.'
          ]
        },
        dos: [
          'Mantenerse bien hidratado durante toda la jornada.',
          'Limpiar superficies interiores con trapos húmedos en vez de barrer en seco.',
          'Ventilar los hogares únicamente en horas de la tarde cuando el aire circule mejor.'
        ],
        donts: [
          'No realizar quemas de hojas secas, basura ni madera al aire libre.',
          'Evitar actividades físicas de alta intensidad en exteriores.',
          'Reducir el uso innecesario de vehículos a combustión particular.'
        ]
      }
    };
  }

  if (lang === 'mr') {
    return {
      language: 'Marathi',
      readingLevel,
      title: `${labels.title} - ${category}`,
      urgency: isSevere ? 'अतिदक्षतेचा इशारा' : (isPoor ? 'आरोग्य सतर्कता' : 'मार्गदर्शक सूचना'),
      summary: readingLevel === 'simple'
        ? `आपल्या परिसरातील हवा आज दूषित नोंदवली गेली आहे (AQI: ${aqi}). हवेत बारीक धूळ आणि धूर (${dominant}) जास्त आहे. विशेषतः ${peakLoc} येथे ${peakTime} वाजता प्रदूषण सर्वाधिक होते (AQI ${peakAqi}). कृपया कामाशिवाय बाहेर जाणे टाळा.`
        : `स्थानिक हवा गुणवत्ता निर्देशांक (AQI) सध्या ${aqi} (${category}) पातळीवर नोंदवला गेला आहे. प्रमुख प्रदूषक ${dominant} असून सर्वाधिक तीव्रता ${peakLoc} परिसरात ${peakTime} दरम्यान (AQI ${peakAqi}) आढळली. नागरिकांनी संरक्षणात्मक उपायांचे पालन करावे.`,
      sections: {
        children: {
          title: labels.sections.children,
          tips: [
            'शाळांनी मैदानी खेळ व सकाळची प्रार्थना हॉलमध्ये किंवा वर्गखोल्यांमध्ये घ्यावी.',
            'लहान मुलांना बाहेर जाताना चांगल्या दर्जाचा N95 मास्क वापरण्यास द्यावा.',
            'दमा असलेल्या मुलांचे औषध आणि इनहेलर जवळ बाळगणे आवश्यक आहे.'
          ]
        },
        seniors: {
          title: labels.sections.seniors,
          tips: [
            'ज्येष्ठ नागरिकांनी सकाळी लवकर थंडीत व धुक्यात फिरणे टाळावे.',
            'घरातील खिडक्या सकाळी बंद ठेवाव्यात जेणेकरून बाहेरील धूर घरात येणार नाही.',
            'छातीत त्रास किंवा धाप लागल्यास तातडीने डॉक्टरांशी संपर्क साधावा.'
          ]
        },
        sensitive: {
          title: labels.sections.sensitive,
          tips: [
            'श्वसनविकार व हृदयविकार असलेल्या व्यक्तींनी घरातच विश्रांती घ्यावी.',
            'घरामध्ये उदबत्ती किंवा डासांची अगरबत्ती लावणे टाळावे.',
            'बाहेर पडणे अपरिहार्य असल्यास N95 मास्कचा कटाक्षाने वापर करावा.'
          ]
        },
        dos: [
          'घशाच्या संरक्षणासाठी कोमट पाणी आणि द्रवपदार्थ भरपूर प्या.',
          'घरात कोरडा केर न काढता ओल्या फडक्याने फरशी पुसावी.',
          'धुळीच्या ठिकाणी पाण्याचा शिडकाव करावा.'
        ],
        donts: [
          'पालापाचोळा किंवा कचरा उघड्यावर अजिबात जाळू नका.',
          'सकाळी आणि संध्याकाळी दमवणारे व्यायाम घराबाहेर करणे टाळा.',
          'खाजगी वाहनांऐवजी सार्वजनिक वाहतुकीचा वापर करा.'
        ]
      }
    };
  }

  return {
    language: 'English',
    readingLevel,
    title: `${labels.title} - ${category} (AQI ${aqi})`,
    urgency: isSevere ? 'CRITICAL PUBLIC HEALTH WARNING' : (isPoor ? 'AIR QUALITY HEALTH ADVISORY' : 'COMMUNITY AIR ALERT'),
    summary: readingLevel === 'simple'
      ? `The air around our neighborhood is unhealthy right now (Air Quality Index: ${aqi}). There is a high amount of fine dust and smoke particles (${dominant}) in the air that can easily get deep into our lungs. The dirtiest air was measured at ${peakLoc} around ${peakTime} with a peak spike of ${peakAqi}. Protect your breath and stay indoors when possible.`
      : readingLevel === 'sensitive'
      ? `CLINICAL PROTOCOL: Ambient AQI has reached ${aqi} (${category}), driven by elevated ${dominant} concentrations. Peak exposure hotspot identified at ${peakLoc} at ${peakTime} (AQI ${peakAqi}). Individuals with respiratory disease, asthma, chronic obstructive pulmonary disease (COPD), or cardiac conditions face elevated risk of bronchospasm and cardiovascular stress.`
      : `Ambient Air Quality Index (AQI) currently averages ${aqi} (${category}). The primary pollutant of concern is ${dominant}. The most severe hotspot occurred at ${peakLoc} at ${peakTime}, recording a peak AQI of ${peakAqi}. Civic authorities recommend community-wide exposure reduction measures.`,
    sections: {
      children: {
        title: labels.sections.children,
        tips: [
          readingLevel === 'simple'
            ? 'Children should play games indoors today instead of running outside in the dirty air.'
            : 'Cancel outdoor physical education (PE) classes, sports practices, and morning playground assemblies.',
          'Ensure children wear snug-fitting N95 or multi-layer certified masks during the morning school commute.',
          'School nurses and teachers should review Asthma Action Plans and verify children carry emergency inhalers.',
          'Keep classroom windows and exterior doors shut; run HEPA air filtration where available.'
        ]
      },
      seniors: {
        title: labels.sections.seniors,
        tips: [
          readingLevel === 'simple'
            ? 'Older adults should take their morning walks inside the house or wait until sunny afternoon hours.'
            : 'Older adults must suspend outdoor morning walks between 06:00 AM and 09:30 AM when thermal inversion traps ground-level pollutants.',
          'Keep bedroom and living area windows securely sealed against outdoor smog penetration.',
          'Maintain strict adherence to prescribed cardiovascular and blood pressure medications; contact emergency care if experiencing chest tightness or unusual shortness of breath.'
        ]
      },
      sensitive: {
        title: labels.sections.sensitive,
        tips: [
          'Asthma and COPD patients: keep quick-relief rescue inhalers (albuterol/salbutamol) immediately accessible at all times.',
          'Eliminate indoor combustion sources: do not burn candles, incense, fireplace wood, or kerosene heaters.',
          'Create a "Clean Air Room" inside the home: an interior room with windows closed, running a portable HEPA air cleaner continuously.',
          'Anyone experiencing persistent coughing, wheezing, or ocular burning should minimize physical exertion and seek medical advice.'
        ]
      },
      dos: [
        'Stay well hydrated with clean water and warm fluids to help mucous membranes clear inhaled particulates.',
        'Wipe indoor surfaces with damp cloths rather than dry sweeping to prevent re-suspending settled fine dust.',
        'If outdoors is unavoidable, wear a certified well-fitted N95 / FFP2 respirator mask.',
        'Operate home HVAC systems in recirculation mode rather than drawing in unfiltered outdoor air.'
      ],
      donts: [
        'DO NOT burn garden waste, leaves, dry grass, or municipal refuse in the open.',
        'Avoid strenuous outdoor cardio workouts, cycling, or jogging during morning and evening rush hours.',
        'Avoid operating diesel generators unless vital for life-safety emergency power.',
        'Do not idle vehicle engines outside housing gates or school drop-off zones.'
      ]
    }
  };
}
