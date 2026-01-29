package com.keralavotes.election.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws IOException, ServletException {

        String header = req.getHeader("Authorization");
        log.info("JwtAuthFilter::doFilterInternal -> Authorization header : {}", header);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                Claims claims = jwtUtil.parseToken(token);
                log.info("JwtAuthFilter::doFilterInternal -> claims : {}", claims);

                String role = claims.get("role", String.class);
                log.info("JwtAuthFilter::doFilterInternal -> role : {}", role);

                List<GrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority("ROLE_" + role));

                Authentication auth = new UsernamePasswordAuthenticationToken(
                        claims.getSubject(), null, authorities);

                SecurityContextHolder.getContext().setAuthentication(auth);
                log.info("JwtAuthFilter::doFilterInternal -> SecurityContextHolder.getContext():setAuth : {}", auth);
            } catch (Exception e) {
                log.error("JwtAuthFilter::doFilterInternal -> Exception:", e);
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(req, res);
    }
}

