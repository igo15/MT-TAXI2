package com.aracuai.mototaxi.controller;

import com.aracuai.mototaxi.dto.CorridaRequest;
import com.aracuai.mototaxi.model.Corrida;
import com.aracuai.mototaxi.service.CorridaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/corridas")
@CrossOrigin(origins = "*")
public class CorridaController {

    private final CorridaService corridaService;

    public CorridaController(CorridaService corridaService) {
        this.corridaService = corridaService;
    }

    /** Cliente solicita uma corrida */
    @PostMapping
    public ResponseEntity<Corrida> solicitar(@Valid @RequestBody CorridaRequest request) {
        Corrida corrida = corridaService.solicitar(request);
        return ResponseEntity.ok(corrida);
    }

    /** Buscar corrida por ID (status em tempo real) */
    @GetMapping("/{id}")
    public ResponseEntity<Corrida> buscar(@PathVariable Long id) {
        return corridaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Listar corridas do cliente */
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Corrida>> listarPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(corridaService.listarPorCliente(clienteId));
    }

    /** Listar corridas solicitadas (para o app do motorista) */
    @GetMapping("/solicitadas")
    public ResponseEntity<List<Corrida>> listarSolicitadas() {
        return ResponseEntity.ok(corridaService.listarSolicitadas());
    }

    /** Motorista aceita a corrida */
    @PutMapping("/{id}/aceitar")
    public ResponseEntity<?> aceitar(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        try {
            Long motoristaId = body.get("motoristaId");
            Corrida corrida = corridaService.aceitar(id, motoristaId);
            return ResponseEntity.ok(corrida);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /** Atualizar status (A_CAMINHO, EM_VIAGEM, FINALIZADA) */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> atualizarStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        try {
            Corrida.StatusCorrida status = Corrida.StatusCorrida.valueOf(body.get("status"));
            Corrida corrida = corridaService.atualizarStatus(id, status);
            return ResponseEntity.ok(corrida);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /** Cancelar corrida */
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id,
                                      @RequestBody(required = false) Map<String, String> body) {
        try {
            String motivo = body != null ? body.getOrDefault("motivo", "Cancelado pelo usuário") : "Cancelado";
            Corrida corrida = corridaService.cancelar(id, motivo);
            return ResponseEntity.ok(corrida);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }
}
