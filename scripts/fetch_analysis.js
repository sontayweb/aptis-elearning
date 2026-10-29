const fs = require('fs');

const examSetIds = [
  'c4c1a08f-d89b-4db2-b098-504701dd8ea8',
  'ced685eb-f48c-43ab-851f-ce2c0a419d6e',
  '8b613577-6568-4eee-8814-21a30a4d7e9d',
  'cf4c3915-647d-46da-833d-a2681542326e'
];

const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY29hbWhiYXRxcHhhdHJyZmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMTgyODgsImV4cCI6MjA4ODY5NDI4OH0.BcFLY1mFlFxCK7E0E89iLlh4am3mEXkbYZaFJ4O_mpw';
const bearer = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjQ1MjI3NTAzLWZhMjYtNDc3ZC04NjJhLTM0ODU0NDhkMzBhNCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2JhY29hbWhiYXRxcHhhdHJyZmx6LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4ZjNmOWMzMi1iM2YxLTRlYWMtODYxNi03ZTY5ZmIxZGYzMzgiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzkzMTk3Mjg2LCJpYXQiOjE3OTMxOTM2ODYsImVtYWlsIjoiaG9hbmdoaWVwMzEwMTAyQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIiwicHJvdmlkZXJzIjpbImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSl9Vd0FwcndvNUxTX2JxcHExNUhIQ08yT1ZBRW9PYU50ZXRvSGswdEpwY010eDVBPXM5Ni1jIiwiZW1haWwiOiJob2FuZ2hpZXAzMTAxMDJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Ikhp4buHcCBIb8OgbmciLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiSGnhu4dwIEhvw6BuZyIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pfVXdBcHJ3bzVMU19icXBxMTVISENPMk9WQUVvT2FOdGV0b0hrMHRKcGNNdHg1QT1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTAwMDEyMTQ3MTAxMzA4NTMwMzg3Iiwic3ViIjoiMTAwMDEyMTQ3MTAxMzA4NTMwMzg3In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib2F1dGgiLCJ0aW1lc3RhbXAiOjE3OTE4MTgwNTd9XSwic2Vzc2lvbl9pZCI6ImE0ZDc1N2Y0LWI3ODQtNGZlMC1iZTk1LWNlNDczYmI0NzEwZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.inmuLym7EWHEWW3pH_sAWJzSuvUiEMgJOXBr3uiiAb4reO1OrLExxCPqdPEO5ptfVXsNb3bHF6uA4XTKndQK9Q';

async function fetchSet(id) {
  const url = `https://bacoamhbatqpxatrrflz.supabase.co/rest/v1/exam_questions?select=*&exam_set_id=eq.${id}&order=order_index.asc`;
  const res = await fetch(url, {
    headers: {
      'apikey': apikey,
      'authorization': 'Bearer ' + bearer,
      'accept': '*/*'
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

async function fetchExamSetDetails(id) {
  const url = `https://bacoamhbatqpxatrrflz.supabase.co/rest/v1/exam_sets?id=eq.${id}&select=*`;
  const res = await fetch(url, {
    headers: {
      'apikey': apikey,
      'authorization': 'Bearer ' + bearer,
      'accept': '*/*'
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] || null;
}

(async () => {
  const results = {};
  for (const id of examSetIds) {
    try {
      const setMeta = await fetchExamSetDetails(id);
      const questions = await fetchSet(id);
      results[id] = {
        meta: setMeta,
        questionsCount: questions.length,
        questions: questions
      };
      console.log(`Set ${id}: ${questions.length} questions. Meta:`, setMeta?.title || setMeta?.name || setMeta?.skill || '(no title)');
    } catch (e) {
      console.error(`Error for ${id}:`, e.message);
    }
  }
  fs.writeFileSync('temp_exam_questions.json', JSON.stringify(results, null, 2));
  console.log('Saved to temp_exam_questions.json');
})();
