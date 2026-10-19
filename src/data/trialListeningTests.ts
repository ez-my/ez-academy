import {TRIAL_LISTENING_2025} from './trialListening2025';
import {TRIAL_LISTENING_2024} from './trialListening2024';

export interface TrialListeningTest {
  id: string;
  name: string;
  year: number;
  questionFileId: string;
  audioFileId: string;
  answerFileId?: string;
  timeMinutes: number;
}

// Original files from the supplied 2026 trial bank. Duplicate copies are omitted. The 2025 bank is added below.
export const TRIAL_LISTENING_TESTS: TrialListeningTest[] = [
  {
    "id": "kuala-lumpur",
    "name": "Kuala Lumpur",
    "year": 2026,
    "questionFileId": "1keL_ST3bXHCMDBE_LcHJfIAVaGqKdrJq",
    "audioFileId": "1dhlAhlbOcaM3fb-lUc4O7Byhf81Oan9f",
    "answerFileId": "1ac3szG9MicVTahdL91Hlh_HYrPKGqJy8",
    "timeMinutes": 40
  },
  {
    "id": "kedah",
    "name": "Kedah",
    "year": 2026,
    "questionFileId": "1C9pC0gKe7AuJVfXqWA4CNpzX50nCKAo_",
    "audioFileId": "1Y_P_s-JhhfufCh6vWc_2Wpccju54OSLg",
    "answerFileId": "1hT85QJwZASY8E9-21RmPTNKMn5ufxMvS",
    "timeMinutes": 40
  },
  {
    "id": "perak",
    "name": "Perak",
    "year": 2026,
    "questionFileId": "1dVrohrk3TxpLfV68RoSaSTKttDTu5Ddm",
    "audioFileId": "1cFsqsfeStwAVqgGuPlVmwHzbwTdJDFPo",
    "answerFileId": "18C2LTAVD2bTvScuO7W3jPAfVz5xmCZ06",
    "timeMinutes": 40
  },
  {
    "id": "kelantan",
    "name": "Kelantan",
    "year": 2026,
    "questionFileId": "1PRycVkTNR42-oQSoIOs8Wh6Skc52Ucmn",
    "audioFileId": "10w2o0wpXQdA_Z0tS-G7uFOVpFT38TADk",
    "answerFileId": "1r8gansBDxCyrXACKGE3cFm7q7wGbFrTb",
    "timeMinutes": 45
  },
  {
    "id": "johor-set-1",
    "name": "Johor — Set 1",
    "year": 2026,
    "questionFileId": "12NWmejFZDy6tz_yvK1C1jhv1T_XlsxM1",
    "audioFileId": "1MimJ3d4mIGWUOLZDh5WXcHc4mDZa9zQI",
    "answerFileId": "1vfFjZgwthbbufvWBaKMYbphyUcNFUbFo",
    "timeMinutes": 40
  },
  {
    "id": "johor-set-3",
    "name": "Johor — Set 3",
    "year": 2026,
    "questionFileId": "13phbSk03wJy80ZzMCDJRcr6qOO5gyWi2",
    "audioFileId": "1pmhRt9VEKq5_RZoIzmg7282fnm4YGUAT",
    "timeMinutes": 40
  },
  {
    "id": "putrajaya",
    "name": "Putrajaya",
    "year": 2026,
    "questionFileId": "1fUGbhK42Tp8adkH3QSYDQLE_xLtqIO54",
    "audioFileId": "1muQdnf5MPHrpbhb8iu2J4f_Gfs-_mazb",
    "answerFileId": "18cOZ9Vahn7ZwTyrQ5elWiSL8rZTioAk4",
    "timeMinutes": 40
  },
  {
    "id": "selangor",
    "name": "Selangor — Set 1",
    "year": 2026,
    "questionFileId": "1855WZmAXmzZ6_LMzwdSbuuZfDaBX9yef",
    "audioFileId": "1_xA95-TuiyZP8hNydUy8wDwlf0avs1sP",
    "answerFileId": "1epHjoqi94veD8f8udchmt1JDsJ_E8ngh",
    "timeMinutes": 40
  },
  {
    "id": "perlis",
    "name": "Perlis",
    "year": 2026,
    "questionFileId": "1u2b9nbH1gEcv_tDfNmok3oNbAVmzWtBw",
    "audioFileId": "1N6xBkpBeJuNMYk_qAbG5KqkRwahbCovH",
    "answerFileId": "1QHnylLomzk6vsLGKG41GJv8rAI62F0BE",
    "timeMinutes": 40
  },
  {
    "id": "melaka",
    "name": "Melaka",
    "year": 2026,
    "questionFileId": "1dNpB3tyLDu2zxqHt4sMba_erBzspybmt",
    "audioFileId": "1QzaDBMEsBu-YkxVJUANOgEB7EnhG0Bxc",
    "answerFileId": "1xymOueBWOyXx7PAcBh4ixNdUJLw4KxsA",
    "timeMinutes": 40
  },
  {
    "id": "pahang",
    "name": "Pahang",
    "year": 2026,
    "questionFileId": "10-xHI23J_dJC7zaxkYZUpPoesBTxcK66",
    "audioFileId": "1kIGfGP6D8rXsdQ05pqjwbDxCsMYfHpX6",
    "answerFileId": "1BDo45w0_ohRVDDR7UN8G0mfbu-fLDJ4m",
    "timeMinutes": 40
  },
  {
    "id": "terengganu",
    "name": "Terengganu",
    "year": 2026,
    "questionFileId": "1KLMoR-Xe7AWPkPYM878bWIrDRbjIFwMU",
    "audioFileId": "1uyz6X_n2u3fI8W6gonaXTTPmgkOBC1Vr",
    "answerFileId": "1KTxzgeXzdd4__YRkKpuL-t6RNrfttEAp",
    "timeMinutes": 40
  },
  {
    "id": "negeri-sembilan",
    "name": "Negeri Sembilan",
    "year": 2026,
    "questionFileId": "1ExeSxH-hgiw1XanhfIZxLZT5Fmqj5J6M",
    "audioFileId": "1B2_DzqdSo_QQw-PwJ_DhowTAjV6-jlH3",
    "answerFileId": "1MOon5Et5FbPnq1_X64wqfezqRZ9nsThf",
    "timeMinutes": 40
  },
  {
    "id": "sarawak-lubok-antu",
    "name": "Sarawak — Lubok Antu",
    "year": 2026,
    "questionFileId": "11p52AhD13fbUPbtk11zXGEFcHRI66IM7",
    "audioFileId": "1Xm_BU7TEfjLeYVFGCoO0LSX91JZzDOBR",
    "answerFileId": "1yj4oPV7Ocbo9iFw6hdulbR5E7d8Susov",
    "timeMinutes": 40
  }
  ,...TRIAL_LISTENING_2025
  ,...TRIAL_LISTENING_2024
];

export const TRIAL_SOURCE_FOLDER = 'https://drive.google.com/drive/folders/1VUVuF3exYvnEtlvBame24j_1FEAI4j_p';
export const LISTENING_PARTS = [
  {id: 1, first: 1, last: 7},
  {id: 2, first: 8, last: 15},
  {id: 3, first: 16, last: 20},
  {id: 4, first: 21, last: 30},
];
export function drivePreviewUrl(id: string): string {
  if (!/^[a-zA-Z0-9_-]{10,128}$/.test(id)) throw new Error('Invalid source file');
  return `https://drive.google.com/file/d/${id}/preview`;
}
export const driveFileUrl = (id: string) => drivePreviewUrl(id).replace('/preview','/view');

export function draftKey(uid: string, testId: string) {
  return `ez_listen_trial_v1:${encodeURIComponent(uid)}:${encodeURIComponent(testId)}`;
}
export function parseTrialDraft(raw: string | null): Record<string,string> {
  try {
    const data = JSON.parse(raw || '{}');
    if (!data || Array.isArray(data) || typeof data !== 'object') return {};
    return Object.fromEntries(Object.entries(data).filter((entry): entry is [string,string] => { const [key,value] = entry; return /^([1-9]|[12][0-9]|30)$/.test(key) && typeof value === 'string' && value.length <= 100; }));
  } catch { return {}; }
}


export function listeningTestLabel(test: TrialListeningTest) {
  return `${test.name.replace(/ — /g,' ')} ${test.year}`;
}
