package com.aracuai.mototaxi.controller;

import com.aracuai.mototaxi.model.Motorista;
import com.aracuai.mototaxi.service.MotoristaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/motoristas")
@CrossOrigin(origins = "*")
public class MotoristaController {

    private final MotoristaService motoristaService;

    public MotoristaController(MotoristaService motoristaService) {
        this.motoristaService = motoristaService;
    }

    /** Lista motoristas livres (disponíveis) */
    @GetMapping("/livres")
    public ResponseEntity<List<Motorista>> listarLivres() {
        return ResponseEntity.ok(motoristaService.listarLivres());
    }

    /** Lista todos */
    @GetMapping
    public ResponseEntity<List<Motorista>> listarTodos() {
        return ResponseEntity.ok(motoristaService.listarTodos());
    }

    /** Atualiza localização do motorista (GPS) */
    @PutMapping("/{id}/localizacao")
    public ResponseEntity<?> atualizarLocalizacao(@PathVariable Long id,
                                                  @RequestBody Map<String, Double> body) {
        try {
            Double lat = body.get("latitude");
            Double lng = body.get("longitude");
            Motorista m = motoristaService.atualizarLocalizacao(id, lat, lng);
            return ResponseEntity.ok(m);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /** Atualiza status (LIVRE, EM_CORRIDA, OFFLINE) */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        try {
            Motorista.StatusMotorista status = Motorista.StatusMotorista.valueOf(body.get("status"));
            Motorista m = motoristaService.atualizarStatus(id, status);
            return ResponseEntity.ok(m);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}
