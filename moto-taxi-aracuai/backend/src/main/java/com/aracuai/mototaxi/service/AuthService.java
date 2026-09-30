package com.aracuai.mototaxi.service;

import com.aracuai.mototaxi.dto.LoginRequest;
import com.aracuai.mototaxi.dto.LoginResponse;
import com.aracuai.mototaxi.model.Usuario;
import com.aracuai.mototaxi.repository.UsuarioRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public LoginResponse login(LoginRequest request) {
        return usuarioRepository.findByLogin(request.getLogin())
                .filter(u -> u.getSenha().equals(request.getSenha()) && Boolean.TRUE.equals(u.getAtivo()))
                .map(u -> new LoginResponse(u.getId(), u.getNome(), u.getTipo().name()))
                .orElse(new LoginResponse(false, "Usuário ou senha inválidos"));
    }
}
