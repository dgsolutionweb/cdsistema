// Este script testa a conexão e autenticação com o Supabase
// Para executar: node testar-login.js

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://zigzcautimlfnptevrpt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppZ3pjYXV0aW1sZm5wdGV2cnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NTg0MDgsImV4cCI6MjA2MjAzNDQwOH0.TuaRdvyF99tZV-X2MP1gotMRQU8ekbff8ETOdekN9Kc';

// Criar cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Credenciais para teste
const email = 'admin@sistema.com';
const password = 'P@ssw0rd2025';

async function testarLogin() {
  console.log('Iniciando teste de autenticação no Supabase...');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Email: ${email}`);
  console.log(`Chave anônima: ${supabaseKey.substring(0, 20)}...`);
  
  try {
    // Verificar se o serviço está online
    console.log('\nVerificando status do serviço Supabase...');
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`);
      console.log(`Status da API: ${response.status}`);
      console.log(`Headers da resposta: ${JSON.stringify([...response.headers.entries()])}`);
      
      // Se não for 405 (Method Not Allowed) ou 400 (Bad Request), pode ser um problema sério
      if (response.status !== 405 && response.status !== 400) {
        console.warn(`Aviso: Status da API inesperado: ${response.status}`);
      } else {
        console.log('API parece estar acessível');
      }
    } catch (fetchError) {
      console.error('Erro ao verificar status da API:');
      console.error(fetchError);
    }
    
    // Tentar fazer login
    console.log('\nTentando login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Erro ao fazer login:');
      console.error(JSON.stringify(error, null, 2));
      console.error('Status:', error.status);
      console.error('Mensagem:', error.message);
      console.error('Código:', error.code);
    } else {
      console.log('Login bem-sucedido!');
      console.log('Dados do usuário:');
      console.log(data.user);
      
      // Tentar buscar dados adicionais do usuário
      console.log('\nBuscando dados adicionais do usuário...');
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (userError) {
        console.error('Erro ao buscar dados do usuário:');
        console.error(userError);
      } else {
        console.log('Dados do perfil do usuário:');
        console.log(userData);
      }
    }
  } catch (err) {
    console.error('Erro inesperado:');
    console.error(err);
  }
}

testarLogin(); 