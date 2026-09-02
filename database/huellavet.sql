--
-- PostgreSQL database dump
--

\restrict XO0yqjQFbBbVJGfQM5L0zEiwza91Gd2h7YfnQBvDeu235SeTLoik9nrgDza6iDz

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-09-02 17:30:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16924)
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    nombres character varying(30) NOT NULL,
    apellido character varying(30) NOT NULL,
    correo character varying(150) NOT NULL,
    contrasena character varying(12) NOT NULL,
    id_usuario integer NOT NULL,
    id_tiposervicio integer NOT NULL,
    foto bytea
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16923)
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_id_seq OWNER TO postgres;

--
-- TOC entry 4990 (class 0 OID 0)
-- Dependencies: 221
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- TOC entry 230 (class 1259 OID 16988)
-- Name: cita; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cita (
    id integer NOT NULL,
    fecha date,
    hora time without time zone,
    estado boolean DEFAULT true,
    modalidad character varying(50),
    ubicacion character varying(150),
    motivo text,
    tiene_costo_reserva boolean DEFAULT false,
    costo_reserva numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    id_usuario integer NOT NULL,
    id_mascota integer NOT NULL,
    id_servicio integer NOT NULL,
    CONSTRAINT cita_costoreserva_check CHECK ((costo_reserva >= (0)::numeric))
);


ALTER TABLE public.cita OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16987)
-- Name: cita_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cita_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cita_id_seq OWNER TO postgres;

--
-- TOC entry 4991 (class 0 OID 0)
-- Dependencies: 229
-- Name: cita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cita_id_seq OWNED BY public.cita.id;


--
-- TOC entry 228 (class 1259 OID 16970)
-- Name: mascota; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mascota (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    especie character varying(50),
    raza character varying(150),
    fecha_nacimiento date NOT NULL,
    peso numeric(5,2),
    color character varying(50),
    fecha_ultima_consulta timestamp without time zone DEFAULT now() NOT NULL,
    vacunas text,
    alergias text,
    observaciones text,
    foto bytea,
    created_at timestamp with time zone DEFAULT now(),
    id_usuario integer NOT NULL,
    CONSTRAINT mascota_check CHECK ((peso > (0)::numeric)),
    CONSTRAINT mascota_fechanacimiento_check CHECK ((fecha_nacimiento <= CURRENT_DATE))
);


ALTER TABLE public.mascota OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16969)
-- Name: mascota_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mascota_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mascota_id_seq OWNER TO postgres;

--
-- TOC entry 4992 (class 0 OID 0)
-- Dependencies: 227
-- Name: mascota_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mascota_id_seq OWNED BY public.mascota.id;


--
-- TOC entry 224 (class 1259 OID 16942)
-- Name: servicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servicio (
    id integer NOT NULL,
    nombre_servicio character varying(150) NOT NULL,
    descripcion text,
    precio numeric(10,2),
    duracion interval NOT NULL,
    modalidad character varying(50),
    esdomicilio boolean DEFAULT false,
    esvirtual boolean DEFAULT false,
    esclinica boolean DEFAULT false,
    direccion_clinica character varying(150),
    tiene_costo_reserva boolean DEFAULT false,
    costo_reserva numeric(10,2),
    id_tiposervicio integer NOT NULL,
    CONSTRAINT servicio_costoreserva_check CHECK ((costo_reserva >= (0)::numeric)),
    CONSTRAINT servicio_precio_check CHECK ((precio > (0)::numeric))
);


ALTER TABLE public.servicio OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16941)
-- Name: servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.servicio_id_seq OWNER TO postgres;

--
-- TOC entry 4993 (class 0 OID 0)
-- Dependencies: 223
-- Name: servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.servicio_id_seq OWNED BY public.servicio.id;


--
-- TOC entry 226 (class 1259 OID 16961)
-- Name: tiposervicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tiposervicio (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);


ALTER TABLE public.tiposervicio OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16960)
-- Name: tiposervicio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tiposervicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tiposervicio_id_seq OWNER TO postgres;

--
-- TOC entry 4994 (class 0 OID 0)
-- Dependencies: 225
-- Name: tiposervicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tiposervicio_id_seq OWNED BY public.tiposervicio.id;


--
-- TOC entry 220 (class 1259 OID 16793)
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    correo character varying(150) NOT NULL,
    contrasena character varying(20) NOT NULL,
    telefono numeric(10,0) NOT NULL,
    indicativo_pais character(3) NOT NULL,
    ciudad character varying(150) NOT NULL,
    fecha_nacimiento date NOT NULL,
    foto bytea,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT usuario_fechanacimiento_check CHECK ((fecha_nacimiento <= CURRENT_DATE))
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16792)
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_id_seq OWNER TO postgres;

--
-- TOC entry 4995 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuario_id_seq OWNED BY public.usuario.id;


--
-- TOC entry 4782 (class 2604 OID 16927)
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- TOC entry 4792 (class 2604 OID 16991)
-- Name: cita id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita ALTER COLUMN id SET DEFAULT nextval('public.cita_id_seq'::regclass);


--
-- TOC entry 4789 (class 2604 OID 16973)
-- Name: mascota id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mascota ALTER COLUMN id SET DEFAULT nextval('public.mascota_id_seq'::regclass);


--
-- TOC entry 4783 (class 2604 OID 16945)
-- Name: servicio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio ALTER COLUMN id SET DEFAULT nextval('public.servicio_id_seq'::regclass);


--
-- TOC entry 4788 (class 2604 OID 16964)
-- Name: tiposervicio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tiposervicio ALTER COLUMN id SET DEFAULT nextval('public.tiposervicio_id_seq'::regclass);


--
-- TOC entry 4780 (class 2604 OID 16796)
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_id_seq'::regclass);


--
-- TOC entry 4976 (class 0 OID 16924)
-- Dependencies: 222
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (id, nombres, apellido, correo, contrasena, id_usuario, id_tiposervicio, foto) FROM stdin;
6	Carlos	Rodriguez	admin1@veterinaria.com	Admin123	11	11	\N
7	Laura	Martinez	admin2@veterinaria.com	Admin456	12	12	\N
8	Andres	Gomez	admin3@veterinaria.com	Admin789	13	13	\N
9	Valentina	Perez	admin4@veterinaria.com	Admin321	14	14	\N
10	Sebastian	Torres	admin5@veterinaria.com	Admin654	15	15	\N
\.


--
-- TOC entry 4984 (class 0 OID 16988)
-- Dependencies: 230
-- Data for Name: cita; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cita (id, fecha, hora, estado, modalidad, ubicacion, motivo, tiene_costo_reserva, costo_reserva, created_at, id_usuario, id_mascota, id_servicio) FROM stdin;
3	2026-09-05	09:00:00	t	Presencial	Calle 80 # 15-20 Bogotá	Consulta veterinaria general	f	0.00	2026-09-02 17:29:55.520623-05	11	11	51
4	2026-09-06	10:30:00	t	Presencial	Calle 80 # 15-20 Bogotá	Vacunación anual	f	0.00	2026-09-02 17:29:55.520623-05	12	12	52
5	2026-09-07	11:00:00	t	Presencial	Calle 80 # 15-20 Bogotá	Desparasitación	f	0.00	2026-09-02 17:29:55.520623-05	13	13	53
6	2026-09-08	14:00:00	t	Presencial	Calle 80 # 15-20 Bogotá	Baño y peluquería	t	10000.00	2026-09-02 17:29:55.520623-05	14	14	54
7	2026-09-09	08:30:00	t	Presencial	Calle 80 # 15-20 Bogotá	Consulta de urgencias	t	20000.00	2026-09-02 17:29:55.520623-05	15	15	55
8	2026-09-10	15:00:00	t	Presencial	Calle 80 # 15-20 Bogotá	Cirugía veterinaria	t	50000.00	2026-09-02 17:29:55.520623-05	16	16	56
9	2026-09-11	09:30:00	t	Presencial	Calle 80 # 15-20 Bogotá	Limpieza dental	t	20000.00	2026-09-02 17:29:55.520623-05	17	17	57
10	2026-09-12	13:00:00	t	Presencial	Calle 80 # 15-20 Bogotá	Hospitalización	t	30000.00	2026-09-02 17:29:55.520623-05	18	18	58
11	2026-09-13	10:00:00	t	Presencial	Calle 80 # 15-20 Bogotá	Exámenes de laboratorio	f	0.00	2026-09-02 17:29:55.520623-05	19	19	59
12	2026-09-14	16:00:00	t	Domicilio	Carrera 20 # 45-10 Bogotá	Consulta veterinaria a domicilio	t	15000.00	2026-09-02 17:29:55.520623-05	20	20	60
\.


--
-- TOC entry 4982 (class 0 OID 16970)
-- Dependencies: 228
-- Data for Name: mascota; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mascota (id, nombre, especie, raza, fecha_nacimiento, peso, color, fecha_ultima_consulta, vacunas, alergias, observaciones, foto, created_at, id_usuario) FROM stdin;
11	Max	Perro	Golden Retriever	2020-04-15	28.50	Dorado	2026-09-02 17:18:44.771352	Rabia, Parvovirus, Moquillo	Ninguna	Mascota tranquila y sociable	\N	2026-09-02 17:18:44.771352-05	11
12	Luna	Gato	Persa	2021-06-20	4.20	Blanco	2026-09-02 17:18:44.771352	Triple felina, Rabia	Polvo	Requiere cepillado frecuente	\N	2026-09-02 17:18:44.771352-05	12
13	Rocky	Perro	Bulldog Francés	2019-02-10	12.80	Atigrado	2026-09-02 17:18:44.771352	Rabia, Parvovirus	Ninguna	Presenta sensibilidad al calor	\N	2026-09-02 17:18:44.771352-05	13
14	Nala	Gato	Siamés	2022-01-12	3.90	Crema	2026-09-02 17:18:44.771352	Triple felina, Rabia	Ninguna	Mascota activa	\N	2026-09-02 17:18:44.771352-05	14
15	Thor	Perro	Pastor Alemán	2018-09-05	35.70	Negro y café	2026-09-02 17:18:44.771352	Rabia, Parvovirus, Moquillo	Pollo	Control de peso recomendado	\N	2026-09-02 17:18:44.771352-05	15
16	Milo	Gato	Mestizo	2023-03-18	4.50	Gris	2026-09-02 17:18:44.771352	Triple felina	Ninguna	Gato joven y activo	\N	2026-09-02 17:18:44.771352-05	16
17	Coco	Perro	Poodle	2020-11-25	8.30	Blanco	2026-09-02 17:18:44.771352	Rabia, Parvovirus	Ninguna	Requiere peluquería periódica	\N	2026-09-02 17:18:44.771352-05	17
18	Simba	Gato	Maine Coon	2019-07-14	7.20	Naranja	2026-09-02 17:18:44.771352	Triple felina, Rabia	Ninguna	Pelaje largo	\N	2026-09-02 17:18:44.771352-05	18
19	Bruno	Perro	Labrador	2021-10-08	24.60	Chocolate	2026-09-02 17:18:44.771352	Rabia, Parvovirus, Moquillo	Ninguna	Muy activo	\N	2026-09-02 17:18:44.771352-05	19
20	Kira	Perro	Beagle	2022-05-30	11.40	Tricolor	2026-09-02 17:18:44.771352	Rabia, Parvovirus	Carne de res	Control veterinario semestral	\N	2026-09-02 17:18:44.771352-05	20
\.


--
-- TOC entry 4978 (class 0 OID 16942)
-- Dependencies: 224
-- Data for Name: servicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicio (id, nombre_servicio, descripcion, precio, duracion, modalidad, esdomicilio, esvirtual, esclinica, direccion_clinica, tiene_costo_reserva, costo_reserva, id_tiposervicio) FROM stdin;
51	Consulta veterinaria general	Evaluación general del estado de salud de la mascota	50000.00	01:00:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	f	0.00	11
52	Vacunación anual	Aplicación de vacunas correspondientes al esquema anual	40000.00	00:30:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	f	0.00	12
53	Desparasitación	Tratamiento preventivo contra parásitos internos y externos	35000.00	00:30:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	f	0.00	13
54	Baño y peluquería	Servicio completo de higiene y peluquería para mascotas	60000.00	02:00:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	t	10000.00	14
55	Consulta de urgencias	Atención veterinaria para casos que requieren atención inmediata	90000.00	01:00:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	t	20000.00	15
56	Cirugía veterinaria	Procedimientos quirúrgicos realizados por personal especializado	350000.00	03:00:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	t	50000.00	16
57	Limpieza dental	Limpieza y revisión odontológica de la mascota	120000.00	01:30:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	t	20000.00	17
58	Hospitalización	Servicio de hospitalización y monitoreo veterinario	150000.00	24:00:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	t	30000.00	18
59	Exámenes de laboratorio	Análisis de muestras para diagnóstico veterinario	80000.00	01:00:00	Presencial	f	f	t	Calle 80 # 15-20 Bogotá	f	0.00	19
60	Consulta veterinaria a domicilio	Consulta veterinaria realizada en el domicilio del cliente	75000.00	01:30:00	Domicilio	t	f	f	\N	t	15000.00	20
\.


--
-- TOC entry 4980 (class 0 OID 16961)
-- Dependencies: 226
-- Data for Name: tiposervicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tiposervicio (id, nombre) FROM stdin;
11	Consulta veterinaria
12	Vacunación
13	Desparasitación
14	Baño y peluquería
15	Urgencias
16	Cirugía
17	Odontología
18	Hospitalización
19	Laboratorio
20	Consulta a domicilio
21	Consulta veterinaria
22	Vacunación
23	Desparasitación
24	Baño y peluquería
25	Urgencias
26	Cirugía
27	Odontología
28	Hospitalización
29	Laboratorio
30	Consulta a domicilio
31	Consulta veterinaria
32	Vacunación
33	Desparasitación
34	Baño y peluquería
35	Urgencias
36	Cirugía
37	Odontología
38	Hospitalización
39	Laboratorio
40	Consulta a domicilio
\.


--
-- TOC entry 4974 (class 0 OID 16793)
-- Dependencies: 220
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (id, nombre_completo, correo, contrasena, telefono, indicativo_pais, ciudad, fecha_nacimiento, foto, created_at) FROM stdin;
11	Carlos Rodriguez	carlos.rodriguez@gmail.com	Carlos123	3001234567	+57	Bogotá	1990-05-15	\N	2026-09-02 17:05:59.615416-05
12	Laura Martinez	laura.martinez@gmail.com	Laura123	3012345678	+57	Medellín	1992-08-21	\N	2026-09-02 17:05:59.615416-05
13	Andres Gomez	andres.gomez@gmail.com	Andres123	3023456789	+57	Cali	1988-03-10	\N	2026-09-02 17:05:59.615416-05
14	Valentina Perez	valentina.perez@gmail.com	Valen123	3034567890	+57	Bogotá	1995-11-02	\N	2026-09-02 17:05:59.615416-05
15	Sebastian Torres	sebastian.torres@gmail.com	Sebas123	3045678901	+57	Barranquilla	1991-07-18	\N	2026-09-02 17:05:59.615416-05
16	Camila Ramirez	camila.ramirez@gmail.com	Camila123	3056789012	+57	Cartagena	1997-01-25	\N	2026-09-02 17:05:59.615416-05
17	Mateo Hernandez	mateo.hernandez@gmail.com	Mateo123	3067890123	+57	Bucaramanga	1989-09-30	\N	2026-09-02 17:05:59.615416-05
18	Sofia Castillo	sofia.castillo@gmail.com	Sofia123	3078901234	+57	Pereira	1994-04-12	\N	2026-09-02 17:05:59.615416-05
19	Daniel Vargas	daniel.vargas@gmail.com	Daniel123	3089012345	+57	Bogotá	1987-12-05	\N	2026-09-02 17:05:59.615416-05
20	Mariana Lopez	mariana.lopez@gmail.com	Mariana123	3090123456	+57	Manizales	1996-06-19	\N	2026-09-02 17:05:59.615416-05
\.


--
-- TOC entry 4996 (class 0 OID 0)
-- Dependencies: 221
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 10, true);


--
-- TOC entry 4997 (class 0 OID 0)
-- Dependencies: 229
-- Name: cita_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cita_id_seq', 12, true);


--
-- TOC entry 4998 (class 0 OID 0)
-- Dependencies: 227
-- Name: mascota_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mascota_id_seq', 20, true);


--
-- TOC entry 4999 (class 0 OID 0)
-- Dependencies: 223
-- Name: servicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servicio_id_seq', 60, true);


--
-- TOC entry 5000 (class 0 OID 0)
-- Dependencies: 225
-- Name: tiposervicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tiposervicio_id_seq', 40, true);


--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuario_id_seq', 20, true);


--
-- TOC entry 4807 (class 2606 OID 16940)
-- Name: admin admin_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_correo_key UNIQUE (correo);


--
-- TOC entry 4809 (class 2606 OID 16938)
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- TOC entry 4817 (class 2606 OID 17003)
-- Name: cita cita_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_pkey PRIMARY KEY (id);


--
-- TOC entry 4815 (class 2606 OID 16986)
-- Name: mascota mascota_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mascota
    ADD CONSTRAINT mascota_pkey PRIMARY KEY (id);


--
-- TOC entry 4811 (class 2606 OID 16959)
-- Name: servicio servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT servicio_pkey PRIMARY KEY (id);


--
-- TOC entry 4813 (class 2606 OID 16968)
-- Name: tiposervicio tiposervicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tiposervicio
    ADD CONSTRAINT tiposervicio_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 2606 OID 16812)
-- Name: usuario usuario_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_correo_key UNIQUE (correo);


--
-- TOC entry 4805 (class 2606 OID 16810)
-- Name: usuario usuraio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuraio_pkey PRIMARY KEY (id);


--
-- TOC entry 4818 (class 2606 OID 17004)
-- Name: admin fk_admin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT fk_admin FOREIGN KEY (id_usuario) REFERENCES public.usuario(id) ON DELETE RESTRICT;


--
-- TOC entry 4819 (class 2606 OID 17009)
-- Name: admin fk_adminservice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT fk_adminservice FOREIGN KEY (id_tiposervicio) REFERENCES public.tiposervicio(id) ON DELETE RESTRICT;


--
-- TOC entry 4823 (class 2606 OID 17029)
-- Name: cita fk_cita; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT fk_cita FOREIGN KEY (id_usuario) REFERENCES public.usuario(id) ON DELETE RESTRICT;


--
-- TOC entry 4824 (class 2606 OID 17034)
-- Name: cita fk_citamascota; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT fk_citamascota FOREIGN KEY (id_mascota) REFERENCES public.mascota(id) ON DELETE RESTRICT;


--
-- TOC entry 4825 (class 2606 OID 17039)
-- Name: cita fk_citaservice; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT fk_citaservice FOREIGN KEY (id_servicio) REFERENCES public.servicio(id) ON DELETE RESTRICT;


--
-- TOC entry 4822 (class 2606 OID 17024)
-- Name: mascota fk_mascota; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mascota
    ADD CONSTRAINT fk_mascota FOREIGN KEY (id_usuario) REFERENCES public.usuario(id) ON DELETE RESTRICT;


--
-- TOC entry 4820 (class 2606 OID 17014)
-- Name: admin fk_servicio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT fk_servicio FOREIGN KEY (id_tiposervicio) REFERENCES public.tiposervicio(id) ON DELETE RESTRICT;


--
-- TOC entry 4821 (class 2606 OID 17019)
-- Name: servicio fk_servicio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT fk_servicio FOREIGN KEY (id_tiposervicio) REFERENCES public.tiposervicio(id) ON DELETE RESTRICT;


-- Completed on 2026-09-02 17:30:52

--
-- PostgreSQL database dump complete
--

\unrestrict XO0yqjQFbBbVJGfQM5L0zEiwza91Gd2h7YfnQBvDeu235SeTLoik9nrgDza6iDz

