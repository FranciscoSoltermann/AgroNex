package org.agronex.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO que representa una conexión de John Deere Operations Center.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JohnDeereConnectionResponse {

    private String id;
    private String orgName;
    private Integer orgId;
    private Integer partnerOrgId;
    private String created;
    private List<Integer> permissions;
}
