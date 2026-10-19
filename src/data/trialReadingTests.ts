import {TRIAL_READING_2024} from './trialReading2024';
import type {ListeningResult} from '../types/listening';
export type ReadingResult = ListeningResult;
export interface TrialReadingTest {id:string;label:string;year:number;questionFileId:string;answerFileId:string|null;keyIssue?:string}
export interface ReadingPage {number:number;image:string;text:string;correction?:string;figure?:string}
export type ReadingPaper = Record<string,ReadingPage[]>;
export const READING_PARTS=[
 {id:1,first:1,last:8,label:'Short texts'},
 {id:2,first:9,last:18,label:'Fill in the blanks'},
 {id:3,first:19,last:26,label:'Long text'},
 {id:4,first:27,last:32,label:'Missing sentences'},
 {id:5,first:33,last:40,label:'Matching & notes'},
];
export function readingChoices(n:number){return (n<=8?'ABC':n<=26?'ABCD':n<=32?'ABCDEFGH':n<=36?'ABCDEF':'').split('');}
export function parseReadingDraft(raw:string|null):Record<string,string>{
 try {const data=JSON.parse(raw||'null');if(!data||typeof data!=='object'||Array.isArray(data))return {};
  return Object.fromEntries(Object.entries(data).filter(([n,v])=>/^([1-9]|[123]\d|40)$/.test(n)&&typeof v==='string'&&v.length<=100)) as Record<string,string>;
 }catch{return {};}
}
// Catalog is populated from the supplied Drive folders. Paper content loads only after selection.
export const TRIAL_READING_TESTS:TrialReadingTest[] = [
  {
    "id": "kuala-lumpur-2026",
    "label": "Kuala Lumpur 2026",
    "year": 2026,
    "questionFileId": "1nwH5D21h2zht_2FpC1S9Cb0NqERbT8Wc",
    "answerFileId": null,
    "keyIssue": "The supplied scheme is for a different question paper."
  },
  {
    "id": "kedah-2026",
    "label": "Kedah 2026",
    "year": 2026,
    "questionFileId": "1Z85hbtEEn0yXvVEtxC9SXZcvb3MPJ3CB",
    "answerFileId": "1BEFpLIC9NS1WdhZeWrn5XMKD30i18w1Y"
  },
  {
    "id": "perak-2026",
    "label": "Perak Set 1 2026",
    "year": 2026,
    "questionFileId": "1qgHmJRYpkGwCkedNWb24qQYz7ThGByVd",
    "answerFileId": "1kjVTgucO83IeaBZwrTNmSixvKL0oNI0I"
  },
  {
    "id": "kelantan-2026",
    "label": "Kelantan 2026",
    "year": 2026,
    "questionFileId": "1LOSZwsLI0kooHabIhV_saQZJ16XhqS49",
    "answerFileId": "16LfiQ29lLLBi9ul6nZsZMMIZIqvcnQ3k"
  },
  {
    "id": "johor-batu-pahat-2026",
    "label": "Johor Batu Pahat Set 3 2026",
    "year": 2026,
    "questionFileId": "1sbyEeSrP2JQfycorx3vSo1NTNplU2NA5",
    "answerFileId": "1WAIVnaXTCpDWRY0VrOm3JXUu-18j8Vn_"
  },
  {
    "id": "sarawak-2026",
    "label": "Sarawak Set 1 2026",
    "year": 2026,
    "questionFileId": "1YjSPk19JicQGkrlVwyxq485RUe7JxGSU",
    "answerFileId": null
  },
  {
    "id": "putrajaya-2026",
    "label": "Putrajaya 2026",
    "year": 2026,
    "questionFileId": "1DBZ5mVqAmuhuX9o49t_UB6nw-bh1DYzk",
    "answerFileId": "1ZBFx4MwhiPbnof-7B2pbC3Qi2HESePlL"
  },
  {
    "id": "selangor-set-1-2026",
    "label": "Selangor Set 1 2026",
    "year": 2026,
    "questionFileId": "1z3_Rhxz1xETF8rOY8hSNpE3_xCQOi-Vm",
    "answerFileId": "15m0UyI_4qgnRount70DjRaQIIsoMH2R5"
  },
  {
    "id": "selangor-set-2-2026",
    "label": "Selangor Set 2 2026",
    "year": 2026,
    "questionFileId": "1p25LSyqz4QygFkLvipTaVuqHdJRoAmP0",
    "answerFileId": "1qB-1eFi32QahpcWW0Rg0CQQc65Ak6E9Z"
  },
  {
    "id": "penang-sabk-2026",
    "label": "SABK 2026",
    "year": 2026,
    "questionFileId": "1PJGrpbWJk_RxLYAQUpFZnbQleSUDrKYc",
    "answerFileId": "1WLiPzVSQqvwL9PwE3dd7JDveCSx4Uky1"
  },
  {
    "id": "perlis-2026",
    "label": "Perlis 2026",
    "year": 2026,
    "questionFileId": "1YV9Ct6Jiv3tYUnDCICpNPR5q3STxHwex",
    "answerFileId": "1wUyius71LWW9IV-puG1XaUp-cP2AVqDv"
  },
  {
    "id": "melaka-2026",
    "label": "Melaka 2026",
    "year": 2026,
    "questionFileId": "162LKZBYIV6VkXlA6U7sGjhnD6us714Hc",
    "answerFileId": "1nzJ8mw7XApyVjOQwnlwIPXTz20XcOCK1"
  },
  {
    "id": "pahang-2026",
    "label": "Pahang 2026",
    "year": 2026,
    "questionFileId": "1xHwZsYWTSLWjlpIUmMVCvShehBTOgTTz",
    "answerFileId": "1kKT9O177br8Z1NIGHmT-driu3uFMPtWx"
  },
  {
    "id": "sbp-2026",
    "label": "SBP 2026",
    "year": 2026,
    "questionFileId": "1ou477oWIwnBhYUZflIrIxP8MXpYqjWiX",
    "answerFileId": "1OYS_5icXe0b8wrL1zlHanVGE1TEfhqlU"
  },
  {
    "id": "terengganu-2026",
    "label": "Terengganu 2026",
    "year": 2026,
    "questionFileId": "1NrzpUQxjAh4wGZfPKRCDDl8n-zVcFj7I",
    "answerFileId": "1qut5nKp3sapeKtL8lHIg5DKRR8O6p9-D"
  },
  {
    "id": "negeri-sembilan-2026",
    "label": "Negeri Sembilan 2026",
    "year": 2026,
    "questionFileId": "1Q0h04hthf9uIPWd9qqdRK6q-TRPNmloo",
    "answerFileId": "12TR1vm36e7D_bra2DAR98yaYilmMRYNj"
  },
  {
    "id": "putrajaya-2025",
    "label": "Putrajaya 2025",
    "year": 2025,
    "questionFileId": "1KgmpPdAwHWcx4HHicPF8xEu6PB2GxNTL",
    "answerFileId": "1GfYGh-1x3tX8Dz0SJRi1E_V52oUC5aGA"
  },
  {
    "id": "selangor-2025",
    "label": "Selangor 2025",
    "year": 2025,
    "questionFileId": "1hde5gHhsT8ZCwSClbBYZKW0RlL1pMErE",
    "answerFileId": "1TMMucXewYMj1driCnbE48znwF7WIm0yd"
  },
  {
    "id": "pahang-2025",
    "label": "Pahang 2025",
    "year": 2025,
    "questionFileId": "1pUm7mjBXF0WMh0u5DArn93EJan2kYlKF",
    "answerFileId": "14vBHsQH8czEAC_57o9dt0bSBATYUdVIs"
  },
  {
    "id": "johor-2025",
    "label": "Johor 2025",
    "year": 2025,
    "questionFileId": "1wt-qOIKl_CVzUQS-ofczKZ0BxVv-e9QR",
    "answerFileId": "193dpSUA5PdKWJQyrdpOhNrOeKlEYCplo"
  },
  {
    "id": "negeri-sembilan-2025",
    "label": "Negeri Sembilan 2025",
    "year": 2025,
    "questionFileId": "1z4df-8UjszmYoUpMaN5DjW8GF1VubDYW",
    "answerFileId": "1LvjclBUXuXkiKB0mc4Enqp4ISvk9qKCe"
  },
  {
    "id": "kelantan-2025",
    "label": "Kelantan 2025",
    "year": 2025,
    "questionFileId": "1GsjDCUOpG863pWM9l5uLir0GHr1282X7",
    "answerFileId": "1RCjGQ8N4ioVjat8hBJcpIW1VlN5OHecT"
  },
  {
    "id": "sabk-set-1-2025",
    "label": "SABK Set 1 2025",
    "year": 2025,
    "questionFileId": "1e1CDjBmRWr2HWZAbSf0co241ZQz3aAAK",
    "answerFileId": "146PELvuQ4WMf7R2jQaVeDG4lsvWAcOHd"
  },
  {
    "id": "sabk-set-2-2025",
    "label": "SABK Set 2 2025",
    "year": 2025,
    "questionFileId": "1PeBL6LarXW1j1HOWdB01KiVMmlOC_bCV",
    "answerFileId": "1Rph4Y1yMX2GoabWUs6TCzGtGQ4WH7bII"
  },
  {
    "id": "perlis-2025",
    "label": "Perlis 2025",
    "year": 2025,
    "questionFileId": "1sZKO1OAOxD9DFq-lI_Wq2NPV6BK2nOAY",
    "answerFileId": "165UjcLwI3Oy2Hu8SROh9aqD2IAQAGvPP"
  },
  {
    "id": "penang-spu-2025",
    "label": "Penang SPU 2025",
    "year": 2025,
    "questionFileId": "10MdNntEhcNAFSl2233GayVWwAQ0QMXnr",
    "answerFileId": "18w-J2UWq1JlX0k-H-e4ofJKF7ba8aQhm"
  },
  {
    "id": "kedah-2025",
    "label": "Kedah 2025",
    "year": 2025,
    "questionFileId": "1GaBijn8822luhSTVnIaeosz39TH-7fTt",
    "answerFileId": "1zbU2ItN_-TxuLVubW435QKadVeAwjrow"
  },
  {
    "id": "perak-2025",
    "label": "Perak 2025",
    "year": 2025,
    "questionFileId": "1uzLzJguOKJyxnz83qhN8IU7xOVSYyHd3",
    "answerFileId": "1tg-j_QZ8KIC3TdVxCLghnufYyMzLJhtc"
  },
  {
    "id": "melaka-2025",
    "label": "Melaka 2025",
    "year": 2025,
    "questionFileId": "1jb8N9FAlckGAyd8xCgdM1kzwY-klxPlM",
    "answerFileId": "1_LTNX17kIEV_sc2d8OffpatJiz7B6PXA"
  },
  {
    "id": "terengganu-2025",
    "label": "Terengganu 2025",
    "year": 2025,
    "questionFileId": "1IhUYq47dB7eUDrthHAjEty2KeyDNBDqE",
    "answerFileId": "1vr5DG7UIojtLNcK3LdOQ37gEKpHcKYo7"
  },
  {
    "id": "sabah-lahad-datu-2026",
    "label": "Sabah Lahad Datu 2026",
    "year": 2026,
    "questionFileId": "18ZwZBJYY-iDPOq2PoOSE1vJIz9-FdOYG",
    "answerFileId": "18ZwZBJYY-iDPOq2PoOSE1vJIz9-FdOYG"
  }
,  ...TRIAL_READING_2024,
];
