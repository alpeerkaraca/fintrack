package com.alpeerkaraca.fintrackserver.DTO;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class GenerateTokenRequest {
    private String userId;
    private String email;
    private String username;
    private String role;

}
