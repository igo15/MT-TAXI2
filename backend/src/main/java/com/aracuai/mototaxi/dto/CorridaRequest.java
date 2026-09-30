package com.aracuai.mototaxi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CorridaRequest {

    @NotNull
    private Long clienteId;

    @NotBlank
    private String origemEndereco;

    @NotNull
    private Double origemLat;

    @NotNull
    private Double origemLng;

    @NotBlank
    private String destinoEndereco;

    @NotNull
    private Double destinoLat;

    @NotNull
    private Double destinoLng;

    @NotBlank
    private String formaPagamento; // PIX ou DINHEIRO

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }

    public String getOrigemEndereco() { return origemEndereco; }
    public void setOrigemEndereco(String origemEndereco) { this.origemEndereco = origemEndereco; }

    public Double getOrigemLat() { return origemLat; }
    public void setOrigemLat(Double origemLat) { this.origemLat = origemLat; }

    public Double getOrigemLng() { return origemLng; }
    public void setOrigemLng(Double origemLng) { this.origemLng = origemLng; }

    public String getDestinoEndereco() { return destinoEndereco; }
    public void setDestinoEndereco(String destinoEndereco) { this.destinoEndereco = destinoEndereco; }

    public Double getDestinoLat() { return destinoLat; }
    public void setDestinoLat(Double destinoLat) { this.destinoLat = destinoLat; }

    public Double getDestinoLng() { return destinoLng; }
    public void setDestinoLng(Double destinoLng) { this.destinoLng = destinoLng; }

    public String getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(String formaPagamento) { this.formaPagamento = formaPagamento; }
}
