package com.keralavotes.election.service;

import com.keralavotes.election.dto.AssemblyAnalysisResponseDto;
import com.keralavotes.election.dto.AssemblyOverviewResponseDto;
import com.keralavotes.election.dto.AssemblyOverviewRowDto;
import com.keralavotes.election.dto.ElectionType;
import com.keralavotes.election.repository.AssemblyConstituencyRepository;
import com.keralavotes.election.repository.LbWardResultRepository;
import com.keralavotes.election.repository.PartyAllianceMappingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssemblyOverviewService {

    private final LbWardResultRepository wardResultRepository;
    private final PartyAllianceMappingRepository partyAllianceMappingRepository;
    private final AssemblyConstituencyRepository assemblyRepository;

    public AssemblyOverviewResponseDto overviewByDistrict(
            Integer districtCode,
            int year,
            List<String> includeTypes
    ) {
        return buildOverview(year, districtCode, includeTypes, "DISTRICT");
    }

    public AssemblyOverviewResponseDto overviewState(
            int year,
            List<String> includeTypes
    ) {
        return buildOverview(year, null, includeTypes, "STATE");
    }

    private AssemblyOverviewResponseDto buildOverview(
            int year,
            Integer districtCode,
            List<String> includeTypes,
            String scope
    ) {

        Map<Long, String> partyAlliance =
                partyAllianceMappingRepository
                        .findForYearAndType(year, ElectionType.LOCALBODY)
                        .stream()
                        .collect(Collectors.toMap(
                                m -> m.getParty().getId(),
                                m -> m.getAlliance().getName()
                        ));

        Map<Integer, Map<String, Long>> acVotes = new HashMap<>();
        Map<Integer, Integer> wardCounts = new HashMap<>();

        try (var stream = wardResultRepository.streamVotesForAssemblyOverview(
                year,
                districtCode,
                normalizeTypes(includeTypes)
        )) {
            stream.forEach(r -> {
                String alliance =
                        r.getPartyId() == null
                                ? "OTH"
                                : partyAlliance.getOrDefault(r.getPartyId(), "OTH");

                acVotes
                        .computeIfAbsent(r.getAcCode(), k -> new HashMap<>())
                        .merge(alliance, (long) r.getVotes(), Long::sum);

                wardCounts.merge(r.getAcCode(), 1, Integer::sum);
            });
        }

        List<AssemblyOverviewRowDto> rows = acVotes.entrySet().stream()
                .map(e -> buildRow(e.getKey(), e.getValue(), wardCounts.get(e.getKey())))
                .sorted(Comparator.comparing(AssemblyOverviewRowDto::getAcName))
                .toList();

        return AssemblyOverviewResponseDto.builder()
                .scope(scope)
                .scopeName(
                        districtCode == null ? "Kerala" :
                                "District " + districtCode
                )
                .year(year)
                .assemblies(rows)
                .build();
    }

    private AssemblyOverviewRowDto buildRow(
            Integer acCode,
            Map<String, Long> votes,
            Integer wardCount
    ) {

        long total = votes.values().stream().mapToLong(Long::longValue).sum();

        List<AssemblyAnalysisResponseDto.AllianceVoteShare> voteShare =
                votes.entrySet().stream()
                        .map(e -> AssemblyAnalysisResponseDto.AllianceVoteShare.builder()
                                .alliance(e.getKey())
                                .votes(e.getValue())
                                .percentage(total == 0 ? 0 : e.getValue() * 100.0 / total)
                                .build())
                        .sorted(Comparator.comparingLong(
                                AssemblyAnalysisResponseDto.AllianceVoteShare::getVotes
                        ).reversed())
                        .toList();

        String winner = voteShare.isEmpty() ? null : voteShare.getFirst().getAlliance();
        Integer margin = voteShare.size() > 1
                ? (int) (voteShare.get(0).getVotes() - voteShare.get(1).getVotes())
                : null;

        var ac = assemblyRepository.findByAcCode(acCode).orElseThrow();

        return AssemblyOverviewRowDto.builder()
                .acCode(acCode)
                .acName(ac.getName())
                .totalWards(wardCount)
                .voteShare(voteShare)
                .winner(winner)
                .margin(margin)
                .build();
    }

    private String[] normalizeTypes(List<String> types) {
        return (types == null || types.isEmpty())
                ? null
                : types.stream().map(String::toLowerCase).toArray(String[]::new);
    }
}
