package com.aracuai.mototaxi.config;

import com.aracuai.mototaxi.model.Motorista;
import com.aracuai.mototaxi.model.Usuario;
import com.aracuai.mototaxi.repository.MotoristaRepository;
import com.aracuai.mototaxi.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Carrega dados iniciais para demonstração.
 */
@Component
public class DataLoader implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final MotoristaRepository motoristaRepository;

    public DataLoader(UsuarioRepository usuarioRepository, MotoristaRepository motoristaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.motoristaRepository = motoristaRepository;
    }

    @Override
    public void run(String... args) {
        // Cliente de teste
        if (!usuarioRepository.existsByLogin("cliente")) {
            Usuario cliente = new Usuario("cliente", "123", "Cliente Demo", Usuario.TipoUsuario.CLIENTE);
            cliente.setTelefone("(33) 99999-0001");
            usuarioRepository.save(cliente);
        }

        // Motoristas de teste
        criarMotoristaSeNaoExistir("joao", "123", "João Silva", "ABC-1D23", "Honda CG 160",
                -16.8530, -42.0680);
        criarMotoristaSeNaoExistir("carlos", "123", "Carlos Mendes", "XYZ-9K87", "Yamaha Factor",
                -16.8470, -42.0590);
        criarMotoristaSeNaoExistir("pedro", "123", "Pedro Lima", "DEF-4M21", "Honda Pop 110",
                -16.8560, -42.0550);

        System.out.println("✅ Dados iniciais carregados (cliente + 3 motoristas)");
    }

    private void criarMotoristaSeNaoExistir(String login, String senha, String nome,
                                            String placa, String modelo,
                                            double lat, double lng) {
        if (!usuarioRepository.existsByLogin(login)) {
            Usuario u = new Usuario(login, senha, nome, Usuario.TipoUsuario.MOTORISTA);
            u.setTelefone("(33) 98888-0000");
            u = usuarioRepository.save(u);

            Motorista m = new Motorista(u, placa, modelo);
            m.setLatitude(lat);
            m.setLongitude(lng);
            m.setStatus(Motorista.StatusMotorista.LIVRE);
            m.setNota(4.8);
            motoristaRepository.save(m);
        }
    }
}
