package com.keralavotes.election.service;

import com.keralavotes.election.dto.details.*;
import com.keralavotes.election.repository.BoothVotesRepository;
import com.keralavotes.election.repository.LocalbodyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalysisDetailService {

    private final BoothVotesRepository repo;
    private final LocalbodyRepository localbodyRepo;

    public Map<String, DetailedYearDataDto> loadDetails(Long lbId, List<Integer> years) {

        Map<String, DetailedYearDataDto> result = new LinkedHashMap<>();

        for (Integer year : years) {

            String type = determineElectionType(year);

            if (type.equals("LOCALBODY")) {
                var rows = repo.getWardAllianceVotes(lbId, year);

                Map<Integer, List<Object[]>> grouped =
                        rows.stream().collect(Collectors.groupingBy(r -> (Integer) r[0], LinkedHashMap::new, Collectors.toList()));

                List<WardDetailDto> wards = new ArrayList<>();

                for (var entry : grouped.entrySet()) {
                    int wardNum = entry.getKey();
                    List<Object[]> list = entry.getValue();

                    String name = (String) list.get(0)[1];

                    long total = list.stream().map(r -> (Long) r[3]).reduce(0L, Long::sum);

                    List<AllianceVoteDetailDto> alliances =
                            list.stream()
                                    .map(r -> AllianceVoteDetailDto.builder()
                                            .alliance((String) r[2])
                                            .votes((Long) r[3])
                                            .percentage(total == 0 ? 0.0 : ((Long) r[3] * 100.0) / total)
                                            .build())
                                    .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                                    .collect(Collectors.toList());

                    String winner = alliances.isEmpty() ? null : alliances.get(0).getAlliance();
                    Long margin = alliances.size() < 2 ? null :
                            alliances.get(0).getVotes() - alliances.get(1).getVotes();

                    wards.add(WardDetailDto.builder()
                            .wardNum(wardNum)
                            .wardName(name)
                            .alliances(alliances)
                            .total(total)
                            .winner(winner)
                            .margin(margin)
                            .build());
                }

                result.put(year.toString(),
                        DetailedYearDataDto.builder()
                                .year(year)
                                .type("LOCALBODY")
                                .wards(wards)
                                .build());

            } else {
                var rows = repo.getBoothAllianceVotes(lbId, year);

                Map<Integer, List<Object[]>> grouped =
                        rows.stream().collect(Collectors.groupingBy(r -> (Integer) r[0], LinkedHashMap::new, Collectors.toList()));

                List<BoothDetailDto> booths = new ArrayList<>();

                for (var entry : grouped.entrySet()) {
                    int psnum = entry.getKey();
                    List<Object[]> list = entry.getValue();

                    String name = (String) list.get(0)[1];

                    long total = list.stream().map(r -> (Long) r[3]).reduce(0L, Long::sum);

                    List<AllianceVoteDetailDto> alliances =
                            list.stream()
                                    .map(r -> AllianceVoteDetailDto.builder()
                                            .alliance((String) r[2])
                                            .votes((Long) r[3])
                                            .percentage(total == 0 ? 0.0 : ((Long) r[3] * 100.0) / total)
                                            .build())
                                    .sorted((a, b) -> Long.compare(b.getVotes(), a.getVotes()))
                                    .collect(Collectors.toList());

                    String winner = alliances.isEmpty() ? null : alliances.get(0).getAlliance();
                    Long margin = alliances.size() < 2 ? null :
                            alliances.get(0).getVotes() - alliances.get(1).getVotes();

                    booths.add(BoothDetailDto.builder()
                            .boothNum(psnum)
                            .boothName(name)
                            .alliances(alliances)
                            .total(total)
                            .winner(winner)
                            .margin(margin)
                            .build());
                }

                result.put(year.toString(),
                        DetailedYearDataDto.builder()
                                .year(year)
                                .type(type)
                                .booths(booths)
                                .build());
            }
        }

        return result;
    }

    private String determineElectionType(Integer year) {
        if (year == 2015 || year == 2020) return "LOCALBODY";
        return "GE";
    }
}
