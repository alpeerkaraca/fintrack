package com.alpeerkaraca.fintrackserver.Controller;

import com.alpeerkaraca.fintrackserver.DTO.TransactionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    @GetMapping
    public List<TransactionDto> getTransaction(@RequestParam("month") int month,
                                               @RequestParam("year") int year,
                                               @RequestParam("type") String type,
                                               @RequestParam("category") String category,
                                               @RequestParam(value = "expanded", defaultValue = "true") boolean expanded) {


        return new ArrayList<>();
    }
}
