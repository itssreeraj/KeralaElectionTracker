--
-- PostgreSQL database dump
--

\restrict QBf75sZGtAYriL3VIeHtCkBigXGyiLxoheu6YorKLp528HlkFUihGCLoNkdRewP

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-15 20:54:03 IST

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

--
-- TOC entry 2 (class 3079 OID 17979)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 3781 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 26181)
-- Name: alliance; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.alliance (
    id bigint NOT NULL,
    name character varying(20) NOT NULL,
    color character varying(10)
);


ALTER TABLE public.alliance OWNER TO keralavotes;

--
-- TOC entry 219 (class 1259 OID 26184)
-- Name: alliance_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.alliance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alliance_id_seq OWNER TO keralavotes;

--
-- TOC entry 3782 (class 0 OID 0)
-- Dependencies: 219
-- Name: alliance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.alliance_id_seq OWNED BY public.alliance.id;


--
-- TOC entry 220 (class 1259 OID 26185)
-- Name: assembly_constituency; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.assembly_constituency (
    id bigint NOT NULL,
    ac_code integer NOT NULL,
    name character varying(150) NOT NULL,
    ls_code bigint,
    district_code bigint
);


ALTER TABLE public.assembly_constituency OWNER TO keralavotes;

--
-- TOC entry 221 (class 1259 OID 26188)
-- Name: assembly_constituency_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.assembly_constituency_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assembly_constituency_id_seq OWNER TO keralavotes;

--
-- TOC entry 3783 (class 0 OID 0)
-- Dependencies: 221
-- Name: assembly_constituency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.assembly_constituency_id_seq OWNED BY public.assembly_constituency.id;


--
-- TOC entry 222 (class 1259 OID 26189)
-- Name: booth_totals; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.booth_totals (
    id bigint NOT NULL,
    ps_id bigint NOT NULL,
    total_valid integer NOT NULL,
    rejected integer NOT NULL,
    nota integer NOT NULL,
    year integer NOT NULL
);


ALTER TABLE public.booth_totals OWNER TO keralavotes;

--
-- TOC entry 223 (class 1259 OID 26192)
-- Name: booth_totals_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.booth_totals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booth_totals_id_seq OWNER TO keralavotes;

--
-- TOC entry 3784 (class 0 OID 0)
-- Dependencies: 223
-- Name: booth_totals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.booth_totals_id_seq OWNED BY public.booth_totals.id;


--
-- TOC entry 224 (class 1259 OID 26193)
-- Name: booth_votes; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.booth_votes (
    id bigint NOT NULL,
    ps_id bigint NOT NULL,
    candidate_id bigint NOT NULL,
    votes integer NOT NULL,
    year integer NOT NULL
);


ALTER TABLE public.booth_votes OWNER TO keralavotes;

--
-- TOC entry 225 (class 1259 OID 26196)
-- Name: booth_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.booth_votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booth_votes_id_seq OWNER TO keralavotes;

--
-- TOC entry 3785 (class 0 OID 0)
-- Dependencies: 225
-- Name: booth_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.booth_votes_id_seq OWNED BY public.booth_votes.id;


--
-- TOC entry 226 (class 1259 OID 26197)
-- Name: candidate; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.candidate (
    id bigint NOT NULL,
    name character varying(200) NOT NULL,
    party_id bigint,
    ls_code bigint,
    election_year integer NOT NULL,
    alliance_id bigint
);


ALTER TABLE public.candidate OWNER TO keralavotes;

--
-- TOC entry 227 (class 1259 OID 26200)
-- Name: candidate_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.candidate_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidate_id_seq OWNER TO keralavotes;

--
-- TOC entry 3786 (class 0 OID 0)
-- Dependencies: 227
-- Name: candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.candidate_id_seq OWNED BY public.candidate.id;


--
-- TOC entry 228 (class 1259 OID 26201)
-- Name: district; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.district (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    district_code integer NOT NULL
);


ALTER TABLE public.district OWNER TO keralavotes;

--
-- TOC entry 229 (class 1259 OID 26204)
-- Name: district_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.district_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.district_id_seq OWNER TO keralavotes;

--
-- TOC entry 3787 (class 0 OID 0)
-- Dependencies: 229
-- Name: district_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.district_id_seq OWNED BY public.district.id;


--
-- TOC entry 230 (class 1259 OID 26205)
-- Name: lb_candidate; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.lb_candidate (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    party_id bigint,
    localbody_id bigint,
    election_year integer NOT NULL
);


ALTER TABLE public.lb_candidate OWNER TO keralavotes;

--
-- TOC entry 231 (class 1259 OID 26208)
-- Name: lb_candidate_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.lb_candidate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lb_candidate_id_seq OWNER TO keralavotes;

--
-- TOC entry 3788 (class 0 OID 0)
-- Dependencies: 231
-- Name: lb_candidate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.lb_candidate_id_seq OWNED BY public.lb_candidate.id;


--
-- TOC entry 232 (class 1259 OID 26209)
-- Name: lb_ward_results; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.lb_ward_results (
    id integer NOT NULL,
    ward_id integer NOT NULL,
    candidate_id integer NOT NULL,
    votes integer NOT NULL,
    election_year integer NOT NULL
);


ALTER TABLE public.lb_ward_results OWNER TO keralavotes;

--
-- TOC entry 233 (class 1259 OID 26212)
-- Name: lb_ward_results_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.lb_ward_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lb_ward_results_id_seq OWNER TO keralavotes;

--
-- TOC entry 3789 (class 0 OID 0)
-- Dependencies: 233
-- Name: lb_ward_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.lb_ward_results_id_seq OWNED BY public.lb_ward_results.id;


--
-- TOC entry 234 (class 1259 OID 26213)
-- Name: localbody; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.localbody (
    id bigint NOT NULL,
    name character varying(150) NOT NULL,
    type character varying(50) NOT NULL,
    district_code bigint
);


ALTER TABLE public.localbody OWNER TO keralavotes;

--
-- TOC entry 235 (class 1259 OID 26216)
-- Name: localbody_ac_mapping; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.localbody_ac_mapping (
    id bigint NOT NULL,
    localbody_id bigint NOT NULL,
    ac_code bigint NOT NULL,
    overlap_weight numeric(5,2)
);


ALTER TABLE public.localbody_ac_mapping OWNER TO keralavotes;

--
-- TOC entry 236 (class 1259 OID 26219)
-- Name: localbody_ac_mapping_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.localbody_ac_mapping_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.localbody_ac_mapping_id_seq OWNER TO keralavotes;

--
-- TOC entry 3790 (class 0 OID 0)
-- Dependencies: 236
-- Name: localbody_ac_mapping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.localbody_ac_mapping_id_seq OWNED BY public.localbody_ac_mapping.id;


--
-- TOC entry 237 (class 1259 OID 26220)
-- Name: localbody_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.localbody_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.localbody_id_seq OWNER TO keralavotes;

--
-- TOC entry 3791 (class 0 OID 0)
-- Dependencies: 237
-- Name: localbody_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.localbody_id_seq OWNED BY public.localbody.id;


--
-- TOC entry 238 (class 1259 OID 26221)
-- Name: loksabha_constituency; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.loksabha_constituency (
    id bigint NOT NULL,
    ls_code integer NOT NULL,
    name character varying(150) NOT NULL,
    state character varying(100) DEFAULT 'Kerala'::character varying
);


ALTER TABLE public.loksabha_constituency OWNER TO keralavotes;

--
-- TOC entry 239 (class 1259 OID 26225)
-- Name: loksabha_constituency_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.loksabha_constituency_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.loksabha_constituency_id_seq OWNER TO keralavotes;

--
-- TOC entry 3792 (class 0 OID 0)
-- Dependencies: 239
-- Name: loksabha_constituency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.loksabha_constituency_id_seq OWNED BY public.loksabha_constituency.id;


--
-- TOC entry 240 (class 1259 OID 26226)
-- Name: party; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.party (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    short_name character varying(20),
    alliance_id bigint
);


ALTER TABLE public.party OWNER TO keralavotes;

--
-- TOC entry 241 (class 1259 OID 26229)
-- Name: party_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.party_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.party_id_seq OWNER TO keralavotes;

--
-- TOC entry 3793 (class 0 OID 0)
-- Dependencies: 241
-- Name: party_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.party_id_seq OWNED BY public.party.id;


--
-- TOC entry 242 (class 1259 OID 26230)
-- Name: polling_station; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.polling_station (
    id bigint NOT NULL,
    ls_code bigint,
    ps_number integer NOT NULL,
    ps_suffix character varying(5),
    ps_number_raw character varying(20),
    name text,
    localbody_id bigint,
    ward_id bigint,
    ac_code integer NOT NULL
);


ALTER TABLE public.polling_station OWNER TO keralavotes;

--
-- TOC entry 243 (class 1259 OID 26235)
-- Name: polling_station_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.polling_station_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.polling_station_id_seq OWNER TO keralavotes;

--
-- TOC entry 3794 (class 0 OID 0)
-- Dependencies: 243
-- Name: polling_station_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.polling_station_id_seq OWNED BY public.polling_station.id;


--
-- TOC entry 244 (class 1259 OID 26236)
-- Name: ward; Type: TABLE; Schema: public; Owner: keralavotes
--

CREATE TABLE public.ward (
    id bigint NOT NULL,
    localbody_id bigint NOT NULL,
    ward_num bigint NOT NULL,
    ward_name character varying(200),
    ward_code character varying,
    ward_details_id character varying(200),
    delimitation_year integer,
    ac_code integer
);


ALTER TABLE public.ward OWNER TO keralavotes;

--
-- TOC entry 245 (class 1259 OID 26241)
-- Name: ward_id_seq; Type: SEQUENCE; Schema: public; Owner: keralavotes
--

CREATE SEQUENCE public.ward_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ward_id_seq OWNER TO keralavotes;

--
-- TOC entry 3795 (class 0 OID 0)
-- Dependencies: 245
-- Name: ward_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keralavotes
--

ALTER SEQUENCE public.ward_id_seq OWNED BY public.ward.id;


--
-- TOC entry 3525 (class 2604 OID 26242)
-- Name: alliance id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.alliance ALTER COLUMN id SET DEFAULT nextval('public.alliance_id_seq'::regclass);


--
-- TOC entry 3526 (class 2604 OID 26243)
-- Name: assembly_constituency id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.assembly_constituency ALTER COLUMN id SET DEFAULT nextval('public.assembly_constituency_id_seq'::regclass);


--
-- TOC entry 3527 (class 2604 OID 26244)
-- Name: booth_totals id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_totals ALTER COLUMN id SET DEFAULT nextval('public.booth_totals_id_seq'::regclass);


--
-- TOC entry 3528 (class 2604 OID 26245)
-- Name: booth_votes id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_votes ALTER COLUMN id SET DEFAULT nextval('public.booth_votes_id_seq'::regclass);


--
-- TOC entry 3529 (class 2604 OID 26246)
-- Name: candidate id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.candidate ALTER COLUMN id SET DEFAULT nextval('public.candidate_id_seq'::regclass);


--
-- TOC entry 3530 (class 2604 OID 26247)
-- Name: district id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.district ALTER COLUMN id SET DEFAULT nextval('public.district_id_seq'::regclass);


--
-- TOC entry 3531 (class 2604 OID 26248)
-- Name: lb_candidate id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_candidate ALTER COLUMN id SET DEFAULT nextval('public.lb_candidate_id_seq'::regclass);


--
-- TOC entry 3532 (class 2604 OID 26249)
-- Name: lb_ward_results id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_ward_results ALTER COLUMN id SET DEFAULT nextval('public.lb_ward_results_id_seq'::regclass);


--
-- TOC entry 3533 (class 2604 OID 26250)
-- Name: localbody id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody ALTER COLUMN id SET DEFAULT nextval('public.localbody_id_seq'::regclass);


--
-- TOC entry 3534 (class 2604 OID 26251)
-- Name: localbody_ac_mapping id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody_ac_mapping ALTER COLUMN id SET DEFAULT nextval('public.localbody_ac_mapping_id_seq'::regclass);


--
-- TOC entry 3535 (class 2604 OID 26252)
-- Name: loksabha_constituency id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.loksabha_constituency ALTER COLUMN id SET DEFAULT nextval('public.loksabha_constituency_id_seq'::regclass);


--
-- TOC entry 3537 (class 2604 OID 26253)
-- Name: party id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.party ALTER COLUMN id SET DEFAULT nextval('public.party_id_seq'::regclass);


--
-- TOC entry 3538 (class 2604 OID 26254)
-- Name: polling_station id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.polling_station ALTER COLUMN id SET DEFAULT nextval('public.polling_station_id_seq'::regclass);


--
-- TOC entry 3539 (class 2604 OID 26255)
-- Name: ward id; Type: DEFAULT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.ward ALTER COLUMN id SET DEFAULT nextval('public.ward_id_seq'::regclass);


--
-- TOC entry 3541 (class 2606 OID 26257)
-- Name: alliance alliance_name_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.alliance
    ADD CONSTRAINT alliance_name_key UNIQUE (name);


--
-- TOC entry 3543 (class 2606 OID 26259)
-- Name: alliance alliance_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.alliance
    ADD CONSTRAINT alliance_pkey PRIMARY KEY (id);


--
-- TOC entry 3545 (class 2606 OID 26261)
-- Name: assembly_constituency assembly_constituency_ac_code_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.assembly_constituency
    ADD CONSTRAINT assembly_constituency_ac_code_key UNIQUE (ac_code);


--
-- TOC entry 3547 (class 2606 OID 26263)
-- Name: assembly_constituency assembly_constituency_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.assembly_constituency
    ADD CONSTRAINT assembly_constituency_pkey PRIMARY KEY (id);


--
-- TOC entry 3550 (class 2606 OID 26265)
-- Name: booth_totals booth_totals_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_totals
    ADD CONSTRAINT booth_totals_pkey PRIMARY KEY (id);


--
-- TOC entry 3552 (class 2606 OID 26267)
-- Name: booth_totals booth_totals_ps_id_year_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_totals
    ADD CONSTRAINT booth_totals_ps_id_year_key UNIQUE (ps_id, year);


--
-- TOC entry 3556 (class 2606 OID 26269)
-- Name: booth_votes booth_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_votes
    ADD CONSTRAINT booth_votes_pkey PRIMARY KEY (id);


--
-- TOC entry 3558 (class 2606 OID 26271)
-- Name: booth_votes booth_votes_ps_id_candidate_id_year_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_votes
    ADD CONSTRAINT booth_votes_ps_id_candidate_id_year_key UNIQUE (ps_id, candidate_id, year);


--
-- TOC entry 3563 (class 2606 OID 26273)
-- Name: candidate candidate_name_ls_id_election_year_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_name_ls_id_election_year_key UNIQUE (name, ls_code, election_year);


--
-- TOC entry 3565 (class 2606 OID 26275)
-- Name: candidate candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_pkey PRIMARY KEY (id);


--
-- TOC entry 3569 (class 2606 OID 26277)
-- Name: district district_name_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.district
    ADD CONSTRAINT district_name_key UNIQUE (name);


--
-- TOC entry 3571 (class 2606 OID 26279)
-- Name: district district_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.district
    ADD CONSTRAINT district_pkey PRIMARY KEY (id);


--
-- TOC entry 3575 (class 2606 OID 26281)
-- Name: lb_candidate lb_candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_candidate
    ADD CONSTRAINT lb_candidate_pkey PRIMARY KEY (id);


--
-- TOC entry 3579 (class 2606 OID 26283)
-- Name: lb_ward_results lb_ward_results_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_ward_results
    ADD CONSTRAINT lb_ward_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3581 (class 2606 OID 26285)
-- Name: lb_ward_results lb_ward_results_ward_id_candidate_id_election_year_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_ward_results
    ADD CONSTRAINT lb_ward_results_ward_id_candidate_id_election_year_key UNIQUE (ward_id, candidate_id, election_year);


--
-- TOC entry 3588 (class 2606 OID 26287)
-- Name: localbody_ac_mapping localbody_ac_mapping_localbody_id_ac_id_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody_ac_mapping
    ADD CONSTRAINT localbody_ac_mapping_localbody_id_ac_id_key UNIQUE (localbody_id, ac_code);


--
-- TOC entry 3590 (class 2606 OID 26289)
-- Name: localbody_ac_mapping localbody_ac_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody_ac_mapping
    ADD CONSTRAINT localbody_ac_mapping_pkey PRIMARY KEY (id);


--
-- TOC entry 3584 (class 2606 OID 26291)
-- Name: localbody localbody_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody
    ADD CONSTRAINT localbody_pkey PRIMARY KEY (id);


--
-- TOC entry 3592 (class 2606 OID 26293)
-- Name: loksabha_constituency loksabha_constituency_ls_code_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.loksabha_constituency
    ADD CONSTRAINT loksabha_constituency_ls_code_key UNIQUE (ls_code);


--
-- TOC entry 3594 (class 2606 OID 26295)
-- Name: loksabha_constituency loksabha_constituency_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.loksabha_constituency
    ADD CONSTRAINT loksabha_constituency_pkey PRIMARY KEY (id);


--
-- TOC entry 3597 (class 2606 OID 26297)
-- Name: party party_name_key; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.party
    ADD CONSTRAINT party_name_key UNIQUE (name);


--
-- TOC entry 3599 (class 2606 OID 26299)
-- Name: party party_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.party
    ADD CONSTRAINT party_pkey PRIMARY KEY (id);


--
-- TOC entry 3604 (class 2606 OID 26301)
-- Name: polling_station polling_station_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.polling_station
    ADD CONSTRAINT polling_station_pkey PRIMARY KEY (id);


--
-- TOC entry 3607 (class 2606 OID 26303)
-- Name: ward ward_details_id_unique; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.ward
    ADD CONSTRAINT ward_details_id_unique UNIQUE (ward_details_id);


--
-- TOC entry 3609 (class 2606 OID 26305)
-- Name: ward ward_pkey; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.ward
    ADD CONSTRAINT ward_pkey PRIMARY KEY (id);


--
-- TOC entry 3611 (class 2606 OID 26307)
-- Name: ward ward_unique_localbody_delim_ward; Type: CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.ward
    ADD CONSTRAINT ward_unique_localbody_delim_ward UNIQUE (localbody_id, delimitation_year, ward_num);


--
-- TOC entry 3548 (class 1259 OID 26308)
-- Name: idx_ac_ls; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_ac_ls ON public.assembly_constituency USING btree (ls_code);


--
-- TOC entry 3553 (class 1259 OID 26309)
-- Name: idx_bt_ps; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_bt_ps ON public.booth_totals USING btree (ps_id);


--
-- TOC entry 3554 (class 1259 OID 26310)
-- Name: idx_bt_year; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_bt_year ON public.booth_totals USING btree (year);


--
-- TOC entry 3559 (class 1259 OID 26311)
-- Name: idx_bv_candidate; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_bv_candidate ON public.booth_votes USING btree (candidate_id);


--
-- TOC entry 3560 (class 1259 OID 26312)
-- Name: idx_bv_ps; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_bv_ps ON public.booth_votes USING btree (ps_id);


--
-- TOC entry 3561 (class 1259 OID 26313)
-- Name: idx_bv_year; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_bv_year ON public.booth_votes USING btree (year);


--
-- TOC entry 3566 (class 1259 OID 26314)
-- Name: idx_candidate_ls; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_candidate_ls ON public.candidate USING btree (ls_code);


--
-- TOC entry 3567 (class 1259 OID 26315)
-- Name: idx_candidate_year; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_candidate_year ON public.candidate USING btree (election_year);


--
-- TOC entry 3585 (class 1259 OID 26316)
-- Name: idx_lb_ac_ac; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_lb_ac_ac ON public.localbody_ac_mapping USING btree (ac_code);


--
-- TOC entry 3586 (class 1259 OID 26317)
-- Name: idx_lb_ac_lb; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_lb_ac_lb ON public.localbody_ac_mapping USING btree (localbody_id);


--
-- TOC entry 3572 (class 1259 OID 26318)
-- Name: idx_lb_candidate_lb; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_lb_candidate_lb ON public.lb_candidate USING btree (localbody_id);


--
-- TOC entry 3573 (class 1259 OID 26319)
-- Name: idx_lb_candidate_year; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_lb_candidate_year ON public.lb_candidate USING btree (election_year);


--
-- TOC entry 3576 (class 1259 OID 26320)
-- Name: idx_lb_wr_ward; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_lb_wr_ward ON public.lb_ward_results USING btree (ward_id);


--
-- TOC entry 3577 (class 1259 OID 26321)
-- Name: idx_lb_wr_year; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_lb_wr_year ON public.lb_ward_results USING btree (election_year);


--
-- TOC entry 3582 (class 1259 OID 26322)
-- Name: idx_localbody_district; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_localbody_district ON public.localbody USING btree (district_code);


--
-- TOC entry 3595 (class 1259 OID 26323)
-- Name: idx_party_alliance; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_party_alliance ON public.party USING btree (alliance_id);


--
-- TOC entry 3600 (class 1259 OID 26324)
-- Name: idx_ps_lb; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_ps_lb ON public.polling_station USING btree (localbody_id);


--
-- TOC entry 3601 (class 1259 OID 26325)
-- Name: idx_ps_ls; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_ps_ls ON public.polling_station USING btree (ls_code);


--
-- TOC entry 3602 (class 1259 OID 26326)
-- Name: idx_ps_ward; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_ps_ward ON public.polling_station USING btree (ward_id);


--
-- TOC entry 3605 (class 1259 OID 26327)
-- Name: idx_ward_localbody; Type: INDEX; Schema: public; Owner: keralavotes
--

CREATE INDEX idx_ward_localbody ON public.ward USING btree (localbody_id);


--
-- TOC entry 3612 (class 2606 OID 26328)
-- Name: assembly_constituency assembly_constituency_ls_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.assembly_constituency
    ADD CONSTRAINT assembly_constituency_ls_id_fkey FOREIGN KEY (ls_code) REFERENCES public.loksabha_constituency(id);


--
-- TOC entry 3613 (class 2606 OID 26333)
-- Name: booth_totals booth_totals_ps_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_totals
    ADD CONSTRAINT booth_totals_ps_id_fkey FOREIGN KEY (ps_id) REFERENCES public.polling_station(id);


--
-- TOC entry 3614 (class 2606 OID 26338)
-- Name: booth_votes booth_votes_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_votes
    ADD CONSTRAINT booth_votes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidate(id);


--
-- TOC entry 3615 (class 2606 OID 26343)
-- Name: booth_votes booth_votes_ps_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.booth_votes
    ADD CONSTRAINT booth_votes_ps_id_fkey FOREIGN KEY (ps_id) REFERENCES public.polling_station(id);


--
-- TOC entry 3616 (class 2606 OID 26348)
-- Name: candidate candidate_ls_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_ls_id_fkey FOREIGN KEY (ls_code) REFERENCES public.loksabha_constituency(id);


--
-- TOC entry 3617 (class 2606 OID 26353)
-- Name: candidate candidate_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.candidate
    ADD CONSTRAINT candidate_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.party(id);


--
-- TOC entry 3618 (class 2606 OID 26358)
-- Name: lb_candidate lb_candidate_localbody_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_candidate
    ADD CONSTRAINT lb_candidate_localbody_id_fkey FOREIGN KEY (localbody_id) REFERENCES public.localbody(id);


--
-- TOC entry 3619 (class 2606 OID 26363)
-- Name: lb_candidate lb_candidate_party_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_candidate
    ADD CONSTRAINT lb_candidate_party_id_fkey FOREIGN KEY (party_id) REFERENCES public.party(id);


--
-- TOC entry 3620 (class 2606 OID 26368)
-- Name: lb_ward_results lb_ward_results_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_ward_results
    ADD CONSTRAINT lb_ward_results_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.lb_candidate(id);


--
-- TOC entry 3621 (class 2606 OID 26373)
-- Name: lb_ward_results lb_ward_results_ward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.lb_ward_results
    ADD CONSTRAINT lb_ward_results_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.ward(id);


--
-- TOC entry 3623 (class 2606 OID 26378)
-- Name: localbody_ac_mapping localbody_ac_mapping_ac_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody_ac_mapping
    ADD CONSTRAINT localbody_ac_mapping_ac_id_fkey FOREIGN KEY (ac_code) REFERENCES public.assembly_constituency(id);


--
-- TOC entry 3624 (class 2606 OID 26383)
-- Name: localbody_ac_mapping localbody_ac_mapping_localbody_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody_ac_mapping
    ADD CONSTRAINT localbody_ac_mapping_localbody_id_fkey FOREIGN KEY (localbody_id) REFERENCES public.localbody(id);


--
-- TOC entry 3622 (class 2606 OID 26388)
-- Name: localbody localbody_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.localbody
    ADD CONSTRAINT localbody_district_id_fkey FOREIGN KEY (district_code) REFERENCES public.district(id);


--
-- TOC entry 3625 (class 2606 OID 26393)
-- Name: party party_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.party
    ADD CONSTRAINT party_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliance(id);


--
-- TOC entry 3626 (class 2606 OID 26398)
-- Name: polling_station polling_station_ac_fk; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.polling_station
    ADD CONSTRAINT polling_station_ac_fk FOREIGN KEY (ac_code) REFERENCES public.assembly_constituency(ac_code);


--
-- TOC entry 3627 (class 2606 OID 26403)
-- Name: polling_station polling_station_localbody_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.polling_station
    ADD CONSTRAINT polling_station_localbody_id_fkey FOREIGN KEY (localbody_id) REFERENCES public.localbody(id);


--
-- TOC entry 3628 (class 2606 OID 26408)
-- Name: polling_station polling_station_ls_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.polling_station
    ADD CONSTRAINT polling_station_ls_id_fkey FOREIGN KEY (ls_code) REFERENCES public.loksabha_constituency(id);


--
-- TOC entry 3629 (class 2606 OID 26413)
-- Name: polling_station polling_station_ward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.polling_station
    ADD CONSTRAINT polling_station_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.ward(id);


--
-- TOC entry 3630 (class 2606 OID 26418)
-- Name: ward ward_ac_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.ward
    ADD CONSTRAINT ward_ac_code_fkey FOREIGN KEY (ac_code) REFERENCES public.assembly_constituency(ac_code);


--
-- TOC entry 3631 (class 2606 OID 26423)
-- Name: ward ward_ac_fk; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.ward
    ADD CONSTRAINT ward_ac_fk FOREIGN KEY (ac_code) REFERENCES public.assembly_constituency(ac_code);


--
-- TOC entry 3632 (class 2606 OID 26428)
-- Name: ward ward_localbody_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keralavotes
--

ALTER TABLE ONLY public.ward
    ADD CONSTRAINT ward_localbody_id_fkey FOREIGN KEY (localbody_id) REFERENCES public.localbody(id);


-- Completed on 2025-12-15 20:54:03 IST

--
-- PostgreSQL database dump complete
--

\unrestrict QBf75sZGtAYriL3VIeHtCkBigXGyiLxoheu6YorKLp528HlkFUihGCLoNkdRewP

