const { Client } = require('pg');

async function debugDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:QDZ41nSPRHNvoRJj@db.pqmncioibiwyzmtxtpgz.supabase.co:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar todas as unidades e suas atividades
    console.log('\n📊 Verificando TODAS as unidades na tabela:');
    const allUnitsQuery = `
      SELECT 
        id, 
        cnpj, 
        trade_name, 
        company_type, 
        activity,
        LENGTH(activity) as activity_length,
        created_at 
      FROM units 
      ORDER BY created_at DESC;
    `;
    
    const result = await client.query(allUnitsQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma unidade encontrada na tabela!');
    } else {
      console.log(`📋 Encontradas ${result.rows.length} unidades:`);
      console.table(result.rows);
      
      // Verificar quantas têm atividade preenchida
      const withActivity = result.rows.filter(row => row.activity && row.activity.trim() !== '');
      const withoutActivity = result.rows.filter(row => !row.activity || row.activity.trim() === '');
      
      console.log(`\n📈 Estatísticas:`);
      console.log(`✅ Com atividade: ${withActivity.length}`);
      console.log(`❌ Sem atividade: ${withoutActivity.length}`);
      
      if (withoutActivity.length > 0) {
        console.log('\n⚠️  Unidades SEM atividade:');
        withoutActivity.forEach(unit => {
          console.log(`- ${unit.trade_name} (${unit.cnpj}) - activity: "${unit.activity}"`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão fechada');
  }
}

debugDatabase();