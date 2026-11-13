/* ==========================================================================
   GLOBAL SOLUTIONS — Traduction du site (français / anglais)
   Bouton de langue « EN / FR » injecté dans l'en-tête et le menu mobile.
   Le choix est mémorisé (localStorage « gs_lang »). Aucune dépendance externe.
   ========================================================================== */
(function () {
  'use strict';

  var DICT = {
  "ACTUALITÉS": "NEWS",
  "AEPS, PEA, ouvrages de stockage, canalisations et plomberie : nous concevons et réalisons des réseaux d'eau potable fiables et durables.": "AEPS, PEA, storage facilities, pipelines and plumbing: we design and build reliable, durable drinking water networks.",
  "AEPS, PEA, ouvrages de stockage, canalisations et plomberie pour un accès durable à l'eau potable.": "AEPS, PEA, storage facilities, pipelines and plumbing for lasting access to drinking water.",
  "Accueil": "Home",
  "Actualités": "News",
  "Actualités et publications de GLOBAL SOLUTIONS.": "News and publications of GLOBAL SOLUTIONS.",
  "Actualités — GLOBAL SOLUTIONS": "News — GLOBAL SOLUTIONS",
  "Actualités — GLOBAL SOLUTIONS | BTP & Hydraulique au Niger": "News — GLOBAL SOLUTIONS | Construction & Hydraulics in Niger",
  "Adduction d'eau potable": "Drinking water supply",
  "Adduction d'eau potable (AEPS / PEA)": "Drinking water supply (AEPS / PEA)",
  "Adresse e-mail *": "Email address *",
  "Adresse e-mail invalide.": "Invalid email address.",
  "Aménagements": "Development",
  "Aménagements hydrauliques": "Water development",
  "Analyse des besoins": "Needs analysis",
  "Analyse des besoins, étude, exécution coordonnée et suivi-contrôle à chaque étape.": "Needs analysis, design, coordinated execution and monitoring at every stage.",
  "Année de création": "Year founded",
  "Année de création — Niamey, Niger.": "Year founded — Niamey, Niger.",
  "Appeler : +227 98 33 61 91": "Call: +227 98 33 61 91",
  "Applications agricoles": "Agricultural applications",
  "Approche technique et professionnelle": "Technical and professional approach",
  "Assainissement": "Sanitation",
  "Aucun projet dans cette catégorie": "No projects in this category",
  "Aucune réalisation ne correspond à ce filtre pour le moment.": "No projects match this filter at the moment.",
  "Aujourd'hui, une dizaine de collaborateurs — ingénieurs et techniciens expérimentés — portent les études, l'exécution et le suivi des chantiers, sous la direction générale et technique de l'entreprise.": "Today, around ten employees — experienced engineers and technicians — handle design, execution and site supervision, under the company's general and technical management.",
  "Autre demande": "Other request",
  "BP 12052, Niamey, Niger": "P.O. Box 12052, Niamey, Niger",
  "BTP & Génie civil": "Construction & Civil Engineering",
  "BTP, eau, énergie, métallique et logistique : une capacité d'intervention dans plusieurs domaines complémentaires.": "Construction, water, energy, steel and logistics: capabilities across complementary fields.",
  "BTP, génie civil et aménagements : notre approche technique et professionnelle au service du développement du Niger.": "Construction, civil engineering and development: our technical and professional approach at the service of Niger's development.",
  "BTP, hydraulique, adduction d'eau potable, énergie solaire et plus.": "Construction, hydraulics, drinking water supply, solar energy and more.",
  "BTP, hydraulique, énergie, métallique, assainissement et logistique : une capacité d'intervention élargie.": "Construction, hydraulics, energy, steel, sanitation and logistics: a broad range of capabilities.",
  "Bas-fonds": "Lowlands",
  "Bienvenue sur le nouveau site de GLOBAL SOLUTIONS": "Welcome to the new GLOBAL SOLUTIONS website",
  "Bâtiment & Génie civil": "Construction & Civil Engineering",
  "Bâtiment & Travaux Publics": "Building and Public Works",
  "Bâtiment et Travaux Publics": "Building and Public Works",
  "Bâtiments": "Buildings",
  "CONSTRUIRE AUJOURD'HUI LES": "BUILDING TOMORROW'S",
  "Calcul de structures": "Structural calculations",
  "Canalisations": "Pipelines",
  "Canalisations et équipements hydrauliques": "Pipes and hydraulic equipment",
  "Canalisations et équipements hydrauliques sur un site": "Pipes and hydraulic equipment on a site",
  "Carte centrée sur Niamey, Niger": "Map centred on Niamey, Niger",
  "Carte indicative centrée sur Niamey (Quartier Koira Kano). Aucune coordonnée précise n'est publiée sans validation de l'entreprise.": "Indicative map centred on Niamey (Koira Kano District). No precise location is published without the company's approval.",
  "Carte — Niamey, Niger": "Map — Niamey, Niger",
  "Cette page n'existe pas ou a été déplacée.": "This page does not exist or has been moved.",
  "Chantier de construction et ouvrages d'infrastructure en Afrique": "Construction site and infrastructure works in Africa",
  "Chargement des projets…": "Loading projects…",
  "Charpentes": "Frameworks",
  "Cinq valeurs qui guident chacune de nos actions.": "Five values that guide everything we do.",
  "Collaborateurs environ": "Employees (approx.)",
  "Compétences multidisciplinaires": "Multidisciplinary skills",
  "Concevoir, étudier et exécuter des ouvrages de bâtiment, de génie civil, d'hydraulique et d'énergie avec expertise technique, professionnalisme et sens du résultat.": "To design, study and execute building, civil engineering, water and energy structures with technical expertise, professionalism and a focus on results.",
  "Construction d'ouvrages d'assainissement, latrines et infrastructures associées pour des conditions sanitaires améliorées.": "Construction of sanitation facilities, latrines and related infrastructure for improved hygiene conditions.",
  "Construction d'ouvrages d'assainissement, latrines et infrastructures associées.": "Construction of sanitation facilities, latrines and related infrastructure.",
  "Construction de bâtiments": "Building construction",
  "Construction de bâtiments, architecture et génie civil : nous assurons les études architecturales, le calcul de structures et le suivi-contrôle des travaux pour des ouvrages conformes et durables.": "Building construction, architecture and civil engineering: we handle architectural design, structural calculations and works supervision to deliver compliant, durable structures.",
  "Construction de bâtiments, architecture, calcul de structures et suivi de travaux avec rigueur technique.": "Building construction, architecture, structural design and works supervision with technical rigour.",
  "Construction de bâtiments, architecture, génie civil, études architecturales, calcul de structures, suivi et contrôle des travaux.": "Building construction, architecture, civil engineering, architectural design, structural analysis, works supervision and control.",
  "Construction métallique": "Steel construction",
  "Construire les infrastructures de demain": "Building the infrastructure of tomorrow",
  "Contact — GLOBAL SOLUTIONS | Nous contacter BTP & Hydraulique à Niamey": "Contact — GLOBAL SOLUTIONS | Construction & Hydraulics in Niamey",
  "Contacter la direction": "Contact the management",
  "Contactez GLOBAL SOLUTIONS SARL à Niamey, Niger. Projets BTP, hydraulique, forage, AEPS et énergie solaire. Tél : +227 98 33 61 91 · info@globalsolutions.one": "Contact GLOBAL SOLUTIONS SARL in Niamey, Niger. Construction, hydraulics, boreholes, water supply and solar energy projects. Tel: +227 98 33 61 91 · info@globalsolutions.one",
  "Contribuer au développement du Niger et de l'Afrique par des infrastructures utiles et durables.": "Contributing to the development of Niger and Africa through useful and durable infrastructure.",
  "Demander des renseignements": "Request information",
  "Demander une consultation": "Request a consultation",
  "Depuis Niamey, nous construisons des infrastructures utiles au développement du Niger et de l'Afrique.": "From Niamey, we build infrastructure that supports the development of Niger and Africa.",
  "Des engagements tenus, un suivi rigoureux et une transparence dans la relation client.": "Commitments kept, rigorous monitoring and transparency in client relationships.",
  "Des ingénieurs et techniciens qui maîtrisent les études, les calculs et l'exécution des ouvrages.": "Engineers and technicians master design, calculations and execution of structures.",
  "Des solutions adaptées aux réalités du terrain, dont l'énergie solaire au service de l'hydraulique.": "Solutions suited to field realities, including solar energy for hydraulics.",
  "Description du besoin *": "Description of your needs *",
  "Directeur Général": "Chief Executive Officer",
  "Directeur Technique": "Technical Director",
  "Direction": "Management",
  "Direction et collaborateurs de GLOBAL SOLUTIONS, Niamey, Niger.": "Management and staff of GLOBAL SOLUTIONS, Niamey, Niger.",
  "Direction générale, direction technique, pôle administratif et financier et pôle logistique : une structure resserrée pour décider vite et exécuter bien.": "General management, technical department, finance and administration and logistics: a lean structure to decide fast and execute well.",
  "Domaine du projet *": "Project area *",
  "Du bâtiment à l'eau potable, de l'énergie à la logistique, GLOBAL SOLUTIONS mobilise des compétences multidisciplinaires au service de vos projets.": "From buildings to drinking water, from energy to logistics, GLOBAL SOLUTIONS mobilises multidisciplinary skills for your projects.",
  "Découvrez GLOBAL SOLUTIONS SARL : entreprise nigérienne créée en 2017 à Niamey, spécialisée en BTP, hydraulique, génie civil, adduction d'eau potable et énergie solaire.": "Discover GLOBAL SOLUTIONS SARL: a Nigerien company founded in 2017 in Niamey, specialising in construction, hydraulics, civil engineering, drinking water supply and solar energy.",
  "Découvrez les 9 expertises de GLOBAL SOLUTIONS : bâtiment et travaux publics, hydraulique villageoise, adduction d'eau potable, énergie solaire, construction métallique, assainissement et logistique.": "Discover the 9 areas of expertise of GLOBAL SOLUTIONS: building and public works, rural hydraulics, drinking water supply, solar energy, steel construction, sanitation and logistics.",
  "Découvrir nos expertises": "Discover our expertise",
  "Découvrir →": "Discover →",
  "Décrivez votre besoin (10 caractères minimum).": "Describe your needs (10 characters minimum).",
  "Décrivez votre projet : localisation, nature des travaux, délais, budget indicatif…": "Describe your project: location, nature of the works, timeline, indicative budget…",
  "Décrivez votre projet : notre équipe vous recontactera pour étudier vos besoins en BTP, hydraulique, énergie et infrastructures.": "Describe your project: our team will get back to you to assess your construction, hydraulics, energy and infrastructure needs.",
  "Décrivez-nous votre besoin : notre équipe étudiera votre projet en BTP, hydraulique ou énergie.": "Tell us about your needs: our team will assess your construction, hydraulics or energy project.",
  "E-mail :": "Email:",
  "En savoir plus →": "Learn more →",
  "Engagement": "Commitment",
  "Entreprise nigérienne de BTP, hydraulique et génie civil. Niamey, Niger — depuis 2017.": "Nigerien construction, hydraulics and civil engineering company. Niamey, Niger — since 2017.",
  "Entreprise nigérienne — Depuis 2017": "Nigerien company — Since 2017",
  "Entreprise ou organisation": "Company or organisation",
  "Envoi en cours…": "Sending…",
  "Envoi impossible": "Unable to send",
  "Envoyer ma demande →": "Send my request →",
  "Ex : Moussa Ibrahim": "e.g. Moussa Ibrahim",
  "Ex : Projet de forage à Niamey": "e.g. Borehole project in Niamey",
  "Expertise technique": "Technical expertise",
  "Expertises": "Expertise",
  "Exploitation et négoce minier": "Mining operations and trade",
  "Exploitation et Négoce minier": "Mining Operations and Trade",
  "Exploitation minière": "Mining operations",
  "Exploitation minière et négoce minier, en appui aux activités techniques et logistiques de l'entreprise.": "Mining operations and mining trade, supporting the company's technical and logistics activities.",
  "Exploitation minière et négoce minier, en appui aux activités techniques, logistiques et commerciales de l'entreprise.": "Mining operations and mining trade, supporting the company's technical, logistics and commercial activities.",
  "Exécution et coordination": "Execution and coordination",
  "Fermer": "Close",
  "Fermer le bandeau": "Close banner",
  "Fiabilité": "Reliability",
  "Filtres réalisations": "Project filters",
  "Forages": "Boreholes",
  "Foreuse et matériel sur un chantier": "Drilling rig and equipment on a construction site",
  "Fourniture d'équipements": "Equipment supply",
  "Fourniture de matériels de forage et d'équipements techniques pour vos projets.": "Supply of drilling equipment and technical equipment for your projects.",
  "Fourniture de matériels de forage et d'équipements techniques pour équiper vos projets hydrauliques et de construction.": "Supply of drilling equipment and technical equipment to equip your water and construction projects.",
  "GLOBAL SOLUTIONS SARL a été créée en 2017 à Niamey, Niger (RCCM : RCCM-NI-NIA-2017-B-003 · NIF : 40242/R). Dès ses débuts, l'entreprise s'est donnée une vocation multidisciplinaire : accompagner les projets de construction, d'hydraulique et d'infrastructures avec une équipe technique resserrée et engagée.": "GLOBAL SOLUTIONS SARL was founded in 2017 in Niamey, Niger (RCCM: RCCM-NI-NIA-2017-B-003 · TIN: 40242/R). From the outset, the company has pursued a multidisciplinary vocation: supporting construction, water and infrastructure projects with a lean and committed technical team.",
  "GLOBAL SOLUTIONS SARL — Tous droits réservés.": "GLOBAL SOLUTIONS SARL — All rights reserved.",
  "GLOBAL SOLUTIONS SARL, entreprise BTP et hydraulique à Niamey (Niger) depuis 2017. Construction de bâtiments, génie civil, forage, adduction d'eau potable, énergie solaire et aménagements hydrauliques.": "GLOBAL SOLUTIONS SARL, construction and hydraulics company in Niamey (Niger) since 2017. Building construction, civil engineering, boreholes, drinking water supply, solar energy and water development.",
  "GLOBAL SOLUTIONS accompagne les projets de construction, de génie civil, d'hydraulique et d'aménagement avec expertise, rigueur et engagement.": "GLOBAL SOLUTIONS supports construction, civil engineering, water and development projects with expertise, rigour and commitment.",
  "GLOBAL SOLUTIONS réunit des ingénieurs et techniciens expérimentés pour conduire des projets dans plusieurs secteurs complémentaires.": "GLOBAL SOLUTIONS brings together experienced engineers and technicians to carry out projects across complementary sectors.",
  "GLOBAL SOLUTIONS — Construire aujourd'hui les infrastructures de demain": "GLOBAL SOLUTIONS — Building tomorrow's infrastructure today",
  "GLOBAL SOLUTIONS — Entreprise BTP, Hydraulique & Génie Civil au Niger | Niamey": "GLOBAL SOLUTIONS — Construction, Hydraulics & Civil Engineering Company in Niger | Niamey",
  "Galerie des réalisations de GLOBAL SOLUTIONS : bâtiments, hydraulique, forages, adduction d'eau potable, énergie solaire, génie civil et construction métallique au Niger.": "Gallery of GLOBAL SOLUTIONS projects: buildings, hydraulics, boreholes, drinking water supply, solar energy, civil engineering and steel construction in Niger.",
  "Grands domaines de compétences": "Core areas of expertise",
  "Génie civil": "Civil engineering",
  "Histoire, vision, mission et valeurs d'une entreprise nigérienne de BTP et d'hydraulique depuis 2017.": "History, vision, mission and values of a Nigerien construction and hydraulics company since 2017.",
  "Horaires & réponse": "Hours & response",
  "Hydraulicien, hydrogéologue et gestionnaire. Cursus universitaire en France et stages auprès de sociétés et bureaux d'études français, suisses, allemands et nigériens. Plusieurs responsabilités au sein du Groupe Belko Hydraulique.": "Hydraulics engineer, hydrogeologist and manager. University background in France and internships with French, Swiss, German and Nigerien companies and engineering firms. Held several responsibilities within the Belko Hydraulique Group.",
  "Hydraulique": "Hydraulics",
  "Hydraulique & Aménagement": "Hydraulics & Development",
  "Hydraulique et Aménagement": "Hydraulics and Development",
  "Hydraulique et aménagements": "Hydraulics and development",
  "Hydraulique villageoise": "Rural hydraulics",
  "Hydraulique villageoise, puits et forages, périmètres irrigués et aménagements de bas-fonds : des solutions d'accès à l'eau et de valorisation agricole adaptées au contexte nigérien.": "Rural hydraulics, wells and boreholes, irrigated perimeters and lowland development: water access and agricultural development solutions suited to the Nigerien context.",
  "Hydraulique villageoise, puits et forages, périmètres irrigués et aménagements de bas-fonds.": "Rural hydraulics, wells and boreholes, irrigated perimeters and lowland development.",
  "Hydraulique villageoise, puits et forages, périmètres irrigués, aménagements de bas-fonds et hydrauliques.": "Rural hydraulics, wells and boreholes, irrigated perimeters, lowland and water development.",
  "INFRASTRUCTURES DE DEMAIN.": "INFRASTRUCTURE TODAY.",
  "Implantée au Niger depuis 2017": "Established in Niger since 2017",
  "Infrastructures associées": "Related infrastructure",
  "L'EXPERTISE AU SERVICE DU DÉVELOPPEMENT": "EXPERTISE AT THE SERVICE OF DEVELOPMENT",
  "Le catalogue de nos projets au Niger : bâtiments, hydraulique, forages, adductions d'eau, aménagements, énergie solaire et génie civil. Cliquez sur une fiche pour découvrir la présentation détaillée et toutes les photographies du chantier.": "The catalogue of our projects in Niger: buildings, hydraulics, boreholes, water supply, development works, solar energy and civil engineering. Click a project to see the detailed presentation and all site photographs.",
  "Le solaire au service de l'hydraulique": "Solar power for water systems",
  "Les dirigeants de GLOBAL SOLUTIONS": "The leadership of GLOBAL SOLUTIONS",
  "Les portraits professionnels seront publiés dès réception des photographies officielles. Aucun portrait généré n'est présenté comme une photographie réelle des dirigeants.": "Professional portraits will be published as soon as official photographs are received. No generated portrait is presented as a real photograph of the leadership.",
  "Lire l'article →": "Read the article →",
  "Lun – Sam : 08h00 – 17h30 (heure de Niamey). Réponse sous 24–48h ouvrées pour les demandes complètes.": "Mon – Sat: 8:00 am – 5:30 pm (Niamey time). Response within 24–48 business hours for complete requests.",
  "Matériel et tiges de forage sur un chantier": "Drilling equipment and rods on a construction site",
  "Matériels de forage": "Drilling equipment",
  "Merci ! Votre demande a bien été transmise à GLOBAL SOLUTIONS. Notre équipe vous recontactera rapidement.": "Thank you! Your request has been sent to GLOBAL SOLUTIONS. Our team will get back to you shortly.",
  "Mise en œuvre coordonnée des travaux par nos équipes techniques et logistiques.": "Coordinated execution of works by our technical and logistics teams.",
  "Multidisciplinarité": "Multidisciplinary",
  "NOS EXPERTISES": "OUR EXPERTISE",
  "NOS RÉALISATIONS": "OUR PROJECTS",
  "NOTRE ÉQUIPE": "OUR TEAM",
  "NOUS CONTACTER": "CONTACT US",
  "Navigation principale": "Main navigation",
  "Neuf domaines complémentaires pour couvrir l'ensemble de vos projets techniques : du bâtiment à l'eau, de l'énergie à la logistique.": "Nine complementary fields to cover all your technical projects: from buildings to water, from energy to logistics.",
  "Neuf expertises complémentaires, une seule exigence : la qualité.": "Nine complementary areas of expertise, one requirement: quality.",
  "Niamey, Niger · BTP · Hydraulique · Génie civil": "Niamey, Niger · Construction · Hydraulics · Civil Engineering",
  "Niamey, Niger — Quartier Koira Kano": "Niamey, Niger — Koira Kano District",
  "Niamey, Niger — Quartier Koira Kano · BP 12052": "Niamey, Niger — Koira Kano District · P.O. Box 12052",
  "Nom de votre structure (optionnel)": "Organisation name (optional)",
  "Nom et prénom *": "Full name *",
  "Nos domaines d'expertise": "Our areas of expertise",
  "Nos expertises": "Our expertise",
  "Nos expertises — BTP, Hydraulique, AEPS, Solaire | GLOBAL SOLUTIONS Niamey": "Our Expertise — Construction, Hydraulics, Water Supply, Solar | GLOBAL SOLUTIONS Niamey",
  "Nos expertises — GLOBAL SOLUTIONS": "Our Expertise — GLOBAL SOLUTIONS",
  "Nos réalisations": "Our projects",
  "Nos réalisations — GLOBAL SOLUTIONS": "Our Projects — GLOBAL SOLUTIONS",
  "Nos réalisations — Projets BTP & Hydraulique | GLOBAL SOLUTIONS Niamey": "Our Projects — Construction & Hydraulics Projects | GLOBAL SOLUTIONS Niamey",
  "Nos solutions solaires pour le pompage et l'électrification accompagnent les projets d'accès à l'eau et d'autonomie énergétique.": "Our solar solutions for pumping and electrification support water access and energy autonomy projects.",
  "Nos valeurs": "Our values",
  "Notre approche": "Our approach",
  "Notre engagement est clair : contribuer au développement du Niger et de l'Afrique par des ouvrages utiles, durables et bien exécutés.": "Our commitment is clear: contribute to the development of Niger and Africa through useful, durable and well-executed structures.",
  "Notre histoire": "Our story",
  "Notre identité": "Our identity",
  "Notre plateforme institutionnelle est en ligne. Les prochaines publications — projets, expertises et engagements — seront partagées ici.": "Our institutional platform is online. Upcoming publications — projects, expertise and commitments — will be shared here.",
  "Notre équipe": "Our team",
  "Notre équipe est disponible pour échanger sur vos besoins et étudier vos projets dans les domaines du BTP et de l'hydraulique.": "Our team is available to discuss your needs and study your construction and hydraulics projects.",
  "Notre équipe — Direction & Collaborateurs | GLOBAL SOLUTIONS Niamey": "Our Team — Management & Staff | GLOBAL SOLUTIONS Niamey",
  "Notre équipe — GLOBAL SOLUTIONS": "Our Team — GLOBAL SOLUTIONS",
  "Nous contacter": "Contact us",
  "Nous contacter — projets BTP, hydraulique et génie civil. Niamey, Niger.": "Contact us — construction, hydraulics and civil engineering projects. Niamey, Niger.",
  "Nous contacter →": "Contact us →",
  "Numéro de téléphone *": "Phone number *",
  "Numéro de téléphone requis.": "Phone number required.",
  "Née à Niamey en 2017, portée par une ambition durable.": "Founded in Niamey in 2017, driven by a lasting ambition.",
  "Négoce minier": "Mining trade",
  "Objet de la demande *": "Subject of the request *",
  "Objet requis.": "Subject required.",
  "Ouvrage d'assainissement avec rampe d'accès": "Sanitation structure with access ramp",
  "Ouvrages d'assainissement": "Sanitation facilities",
  "Ouvrages de stockage": "Storage facilities",
  "Ouvrages spéciaux": "Special structures",
  "Ouvrir le menu": "Open menu",
  "Page introuvable (404) — GLOBAL SOLUTIONS": "Page not found (404) — GLOBAL SOLUTIONS",
  "Panneaux solaires sur un site d'accès à l'eau": "Solar panels at a water access site",
  "Parlons de vos besoins en BTP, hydraulique ou énergie. Notre équipe vous répond rapidement.": "Let's discuss your construction, hydraulics or energy needs. Our team will respond quickly.",
  "Parlons de votre projet": "Let's discuss your project",
  "Pays d'implantation": "Home country",
  "Photo précédente": "Previous photo",
  "Photo suivante": "Next photo",
  "Plomberie": "Plumbing",
  "Point d'eau avec robinets de distribution": "Water point with distribution taps",
  "Portfolio filtrable des projets GLOBAL SOLUTIONS.": "Filterable portfolio of GLOBAL SOLUTIONS projects.",
  "Pourquoi nous": "Why choose us",
  "Professionnalisme": "Professionalism",
  "Présentation": "Introduction",
  "Publications, projets et engagements de GLOBAL SOLUTIONS. Les articles sont gérés via Supabase et publiés ici dès validation.": "Publications, projects and commitments of GLOBAL SOLUTIONS. Articles are managed via Supabase and published here once approved.",
  "Puits & forages": "Wells & boreholes",
  "Périmètres irrigués": "Irrigated perimeters",
  "REJOIGNEZ UNE ÉQUIPE TECHNIQUE ET ENGAGÉE.": "JOIN A TECHNICAL AND COMMITTED TEAM.",
  "Rencontrez la direction de GLOBAL SOLUTIONS SARL : Abdoul Aziz Mamane ALTINE (DG), Mahamadou Bachir ALTINE (Directeur Technique), Harouna Abderhamane Bello (RAF) et Moumouni Amadou (Logistique).": "Meet the leadership of GLOBAL SOLUTIONS SARL: Abdoul Aziz Mamane ALTINE (CEO), Mahamadou Bachir ALTINE (Technical Director), Harouna Abderhamane Bello (Finance & Administration) and Moumouni Amadou (Logistics).",
  "Renouvelables & fossiles": "Renewables & fossil energy",
  "Responsable Administratif et Financier": "Head of Finance and Administration",
  "Responsable Logistique": "Head of Logistics",
  "Responsable administratif et financier de GLOBAL SOLUTIONS : gestion, suivi financier et coordination administrative des projets.": "Head of finance and administration at GLOBAL SOLUTIONS: management, financial monitoring and administrative coordination of projects.",
  "Responsable logistique de GLOBAL SOLUTIONS : organisation des transports, approvisionnement des chantiers et coordination des moyens.": "Head of logistics at GLOBAL SOLUTIONS: transport organisation, site supply and coordination of resources.",
  "Retour en haut": "Back to top",
  "Retour à l'accueil": "Back to home",
  "Retournez à l'accueil ou contactez-nous directement — notre équipe vous répondra rapidement.": "Go back to the home page or contact us directly — our team will respond quickly.",
  "Réhabilitation d'un mur sur un chantier": "Wall rehabilitation on a construction site",
  "Secteurs :": "Sectors:",
  "Société nigérienne créée en 2017 à Niamey, GLOBAL SOLUTIONS intervient dans le BTP, l'hydraulique et les infrastructures. Notre vocation multidisciplinaire — bâtiment, eau, énergie et construction — nous permet d'accompagner des projets de différentes envergures avec une approche technique et professionnelle.": "Founded in 2017 in Niamey, GLOBAL SOLUTIONS operates in construction, water and infrastructure. Our multidisciplinary vocation — buildings, water, energy and construction — enables us to support projects of all sizes with a technical and professional approach.",
  "Solaire hydraulique": "Solar water systems",
  "Structure et couverture métalliques sur un chantier": "Steel structure and roofing on a construction site",
  "Suivez les actualités de GLOBAL SOLUTIONS : projets, expertises et engagements au service du développement du Niger et de l'Afrique.": "Follow the news of GLOBAL SOLUTIONS: projects, expertise and commitments at the service of Niger and Africa's development.",
  "Suivi & contrôle": "Supervision & control",
  "Suivi et contrôle": "Monitoring and control",
  "Suivi et contrôle des travaux jusqu'à la réception, avec un reporting transparent.": "Monitoring and control of works through to handover, with transparent reporting.",
  "Technicien GLOBAL SOLUTIONS en intervention sur un bâtiment": "GLOBAL SOLUTIONS technician working on a building",
  "Tous": "All",
  "Transport de matériaux": "Material transport",
  "Transport de matériaux et de moellons, avec une organisation logistique dédiée aux chantiers.": "Transport of materials and gravel, with dedicated logistics for construction sites.",
  "Transport de matériaux et de moellons, avec une organisation logistique dédiée à l'approvisionnement des chantiers.": "Transport of materials and gravel, with dedicated logistics for supplying construction sites.",
  "Transport de moellons": "Gravel transport",
  "Transport et Logistique": "Transport and Logistics",
  "Travaux de construction métallique pour des ouvrages robustes : charpentes, structures et ouvrages spéciaux.": "Steel construction work for robust structures: frameworks, structures and special works.",
  "Travaux de construction métallique pour des ouvrages robustes et durables.": "Steel construction work for robust, durable structures.",
  "Travaux de réhabilitation d'un bâtiment": "Building rehabilitation works",
  "Tél :": "Tel:",
  "UN PROJET SIMILAIRE ? PARLONS-EN.": "A SIMILAR PROJECT? LET'S TALK.",
  "UN PROJET, UNE ÉQUIPE, UN ENGAGEMENT.": "ONE PROJECT, ONE TEAM, ONE COMMITMENT.",
  "Un projet, une étude, un chantier ? Échangez directement avec notre direction.": "A project, a study, a site? Talk directly with our management.",
  "Une connaissance du terrain, des réalités locales et des exigences des projets au Niger et en Afrique.": "In-depth knowledge of the field, local realities and the requirements of projects in Niger and Africa.",
  "Une direction expérimentée et une dizaine de collaborateurs — ingénieurs et techniciens — au service de vos projets.": "Experienced management and around ten employees — engineers and technicians — at your service.",
  "Une dizaine de collaborateurs, dont des ingénieurs et techniciens expérimentés, encadrés par une direction technique.": "Around ten employees, including experienced engineers and technicians, led by a technical management team.",
  "Une entreprise nigérienne structurée, née à Niamey en 2017, au service des infrastructures, de l'eau, de l'énergie et de la construction.": "A structured Nigerien company, founded in Niamey in 2017, serving infrastructure, water, energy and construction.",
  "Une entreprise structurée, une équipe technique, une ambition durable.": "A structured company, a technical team, a lasting ambition.",
  "Une identité claire : expertise, fiabilité, innovation.": "A clear identity: expertise, reliability, innovation.",
  "Une méthodologie claire, du besoin à la réception.": "A clear methodology, from needs assessment to handover.",
  "Une organisation structurée, des méthodes claires et un souci constant de la qualité.": "A structured organisation, clear methods and a constant focus on quality.",
  "VOUS AVEZ UN PROJET ? CONSTRUISONS-LE ENSEMBLE.": "HAVE A PROJECT? LET'S BUILD IT TOGETHER.",
  "Veuillez choisir un domaine.": "Please select an area.",
  "Veuillez corriger les champs indiqués en rouge.": "Please correct the fields highlighted in red.",
  "Veuillez patienter un instant.": "Please wait a moment.",
  "Veuillez saisir votre nom et prénom.": "Please enter your full name.",
  "Visionneuse image": "Image viewer",
  "Voir nos expertises": "See our expertise",
  "Vos données sont utilisées uniquement pour traiter votre demande. Aucune revente à des tiers.": "Your data is used solely to process your request. It is never sold to third parties.",
  "Vue d'ensemble d'un site aménagé": "Overview of a developed site",
  "bâtiments industriels, hangars, ouvrages d'art.": "industrial buildings, warehouses, bridges.",
  "bâtiments publics et privés, ouvrages de génie civil, aménagements.": "public and private buildings, civil engineering works, development projects.",
  "chantiers BTP, carrières, sites de construction.": "construction sites, quarries, building sites.",
  "collectivités rurales, agriculture, communautés villageoises.": "rural communities, agriculture, villages.",
  "collectivités, écoles, équipements publics.": "communities, schools, public facilities.",
  "de Supabase (statut = publie).": "table in Supabase (status = publie).",
  "entreprises de forage, chantiers, collectivités.": "drilling companies, construction sites, communities.",
  "pompage solaire, sites isolés, agriculture, bâtiments.": "solar pumping, remote sites, agriculture, buildings.",
  "sites miniers, négoce et logistique associée.": "mining sites, trade and associated logistics.",
  "villages, quartiers, équipements publics, sites industriels.": "villages, neighbourhoods, public facilities, industrial sites.",
  "vous@exemple.com": "you@example.com",
  "À PROPOS DE GLOBAL SOLUTIONS": "ABOUT GLOBAL SOLUTIONS",
  "À compléter": "Coming soon",
  "À propos": "About us",
  "À propos — GLOBAL SOLUTIONS": "About — GLOBAL SOLUTIONS",
  "À propos — GLOBAL SOLUTIONS | Entreprise BTP & Hydraulique à Niamey, Niger": "About — GLOBAL SOLUTIONS | Construction & Hydraulics Company in Niamey, Niger",
  "À propos →": "About →",
  "Économiste et gestionnaire. Parcours universitaire en France et aux États-Unis, avec des stages de formation dans des entreprises américaines. Rentré au Niger en 2009, il a dirigé IX COM Niger avant de devenir Directeur Général de GLOBAL SOLUTIONS.": "Economist and manager. University background in France and the United States, with training internships in US companies. Returned to Niger in 2009, he led IX COM Niger before becoming Chief Executive Officer of GLOBAL SOLUTIONS.",
  "Écoute, visite de site et compréhension précise de vos contraintes techniques, budgétaires et calendaires.": "Listening, site visits and a precise understanding of your technical, budgetary and scheduling constraints.",
  "Électrification": "Electrification",
  "Énergie & Solaire": "Energy & Solar",
  "Énergie et Systèmes solaires": "Energy and Solar Systems",
  "Énergie solaire": "Solar energy",
  "Énergie solaire, solutions solaires pour l'hydraulique, électrification et applications agricoles : l'énergie renouvelable au service de l'autonomie des projets.": "Solar energy, solar solutions for hydraulics, electrification and agricultural applications: renewable energy for project autonomy.",
  "Énergie solaire, solutions solaires pour l'hydraulique, électrification et applications agricoles.": "Solar energy, solar solutions for hydraulics, electrification and agricultural applications.",
  "Énergie solaire, solutions solaires pour l'hydraulique, électrification, applications agricoles et énergies renouvelables.": "Solar energy, solar solutions for hydraulics, electrification, agricultural applications and renewable energy.",
  "Équipe d'ingénieurs et de techniciens": "Team of engineers and technicians",
  "Équipements techniques": "Technical equipment",
  "Étude et conception technique": "Design and engineering",
  "Études architecturales": "Architectural design",
  "Études architecturales, calculs de structures et conception des ouvrages adaptés à votre projet.": "Architectural design, structural calculations and structures designed for your project.",
  "Être un partenaire technique de référence au Niger et en Afrique pour les projets de BTP, d'hydraulique et d'infrastructures, reconnu pour sa rigueur et son engagement.": "To be a leading technical partner in Niger and Africa for construction, hydraulics and infrastructure projects, recognised for rigour and commitment.",
  "— Choisir un domaine —": "— Select an area —",
  "ℹ️ Cette méthodologie est présentée à titre de présentation de notre démarche. Elle ne constitue ni une certification ni une procédure officiellement documentée.": "ℹ️ This methodology is presented to illustrate our approach. It does not constitute a certification or an officially documented procedure.",
  "ℹ️ Les articles ci-dessus sont des emplacements éditoriaux. Les actualités définitives seront alimentées depuis la table": "ℹ️ The articles above are editorial placeholders. Final news items will be fed from the",
  "ℹ️ Les initiales ci-dessus sont des placeholders en attente des portraits officiels. L'entreprise compte une dizaine de collaborateurs, notamment des ingénieurs et techniciens expérimentés.": "ℹ️ The initials above are placeholders pending official portraits. The company has around ten employees, including experienced engineers and technicians.",
  "✉️ E-mail": "✉️ Email",
  "📞 Appeler": "📞 Call"
  };

  var STORAGE_KEY = 'gs_lang';
  var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  var current = 'fr';
  try { if (localStorage.getItem(STORAGE_KEY) === 'en') current = 'en'; } catch (e) {}
  var applying = false;
  var origTitle = document.title;
  var metaNodes = [];
  Array.prototype.forEach.call(
    document.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[property="og:title"], meta[name="twitter:description"]'),
    function (m) { metaNodes.push([m, m.getAttribute('content') || '']); }
  );

  function tr(s) { return current === 'en' ? (DICT[s] || s) : s; }

  function skippable(node) {
    var p = node.parentElement;
    if (!p) return true;
    var tag = p.nodeName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE') return true;
    return !!(p.closest && p.closest('[data-i18n-skip]'));
  }

  function applyText(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node, raw, key, out, lead, trail, next;
    while ((node = walker.nextNode())) {
      if (skippable(node)) continue;
      raw = (node.__i18nFr !== undefined) ? node.__i18nFr : node.textContent;
      key = raw.trim();
      if (key.length < 2) continue;
      if (node.__i18nFr === undefined) node.__i18nFr = raw;
      out = current === 'en' ? (DICT[key] || key) : key;
      lead = raw.match(/^\s*/)[0];
      trail = raw.match(/\s*$/)[0];
      next = lead + out + trail;
      if (node.textContent !== next) node.textContent = next;
    }
  }

  function applyAttrs(root) {
    if (!root || !root.querySelectorAll) return;
    ATTRS.forEach(function (attr) {
      Array.prototype.forEach.call(root.querySelectorAll('[' + attr + ']'), function (el) {
        if (el.closest && el.closest('[data-i18n-skip]')) return;
        var raw = el.getAttribute(attr) || '';
        var key = raw.trim();
        if (key.length < 2) return;
        if (!el.__i18nAttrs) el.__i18nAttrs = {};
        if (el.__i18nAttrs[attr] === undefined) el.__i18nAttrs[attr] = raw;
        var orig = el.__i18nAttrs[attr].trim();
        var out = current === 'en' ? (DICT[orig] || orig) : orig;
        if (el.getAttribute(attr) !== out) el.setAttribute(attr, out);
      });
    });
  }

  function updateButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.lang-switch'), function (b) {
      var target = (current === 'en') ? 'fr' : 'en';
      b.textContent = target.toUpperCase();
      b.setAttribute('aria-label', target === 'en' ? 'Switch to English' : 'Passer en français');
      b.setAttribute('title', target === 'en' ? 'Switch to English' : 'Passer en français');
    });
  }

  function applyAll() {
    applying = true;
    applyText(document.body);
    applyAttrs(document);
    document.title = tr(origTitle);
    metaNodes.forEach(function (pair) {
      var v = pair[1].trim();
      pair[0].setAttribute('content', current === 'en' ? (DICT[v] || v) : v);
    });
    document.documentElement.lang = (current === 'en') ? 'en' : 'fr';
    updateButtons();
    applying = false;
  }

  function setLang(lang) {
    current = (lang === 'en') ? 'en' : 'fr';
    try { localStorage.setItem(STORAGE_KEY, current); } catch (e) {}
    applyAll();
  }

  function toggle() { setLang(current === 'en' ? 'fr' : 'en'); }

  function buildButton(extraClass) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'lang-switch' + (extraClass ? ' ' + extraClass : '');
    b.setAttribute('data-i18n-skip', '');
    b.addEventListener('click', toggle);
    return b;
  }

  function injectButtons() {
    var headerInner = document.querySelector('.header-inner');
    if (headerInner && !headerInner.querySelector('.lang-switch')) {
      var cta = headerInner.querySelector('.header-cta');
      var b = buildButton('');
      if (cta) cta.insertBefore(b, cta.firstChild);
      else headerInner.appendChild(b);
    }
    var mobile = document.querySelector('.mobile-menu');
    if (mobile && !mobile.querySelector('.lang-switch')) {
      mobile.appendChild(buildButton('lang-switch--mobile'));
    }
    updateButtons();
  }

  var debounceTimer = null;
  function refreshDynamic() {
    if (applying) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      if (current !== 'en') return;
      applying = true;
      applyText(document.body);
      applyAttrs(document);
      applying = false;
    }, 250);
  }

  function init() {
    injectButtons();
    applyAll();
    if (window.MutationObserver && document.body) {
      new MutationObserver(refreshDynamic).observe(document.body, {
        subtree: true, childList: true, characterData: true
      });
    }
    document.addEventListener('gs:ready', function () {
      setTimeout(function () {
        if (current !== 'en') return;
        applying = true;
        applyText(document.body);
        applyAttrs(document);
        applying = false;
      }, 60);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
