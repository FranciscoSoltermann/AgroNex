package org.agronex.backend.controller;

import lombok.RequiredArgsConstructor;
import org.agronex.backend.dto.response.DashboardResumenDTO;
import org.agronex.backend.infrastructure.security.SecurityUtils;
import org.agronex.backend.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumenDTO> obtenerResumen(@AuthenticationPrincipal Jwt jwt) {
        UUID idUsuario = SecurityUtils.requireUserId(jwt);
        DashboardResumenDTO resumen = dashboardService.obtenerResumenDashboard(idUsuario);
        return ResponseEntity.ok(resumen);
    }
}
