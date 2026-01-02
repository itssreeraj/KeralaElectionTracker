package com.keralavotes.election.repository;

import com.keralavotes.election.entity.LbWardResult;
import com.keralavotes.election.model.VoteRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

public interface LbWardResultRepository extends JpaRepository<LbWardResult, Integer> {
    Optional<LbWardResult> findByWardIdAndCandidateIdAndElectionYear(Integer wardId, Integer candidateId, Integer electionYear);

    List<LbWardResult> findByElectionYearAndCandidateIdIn(int year, Set<Integer> candIds);

    List<LbWardResult> findByElectionYearAndWardIdIn(int year, Set<Long> wardIds);



    @Query("""
        SELECT r
        FROM LbWardResult r
        JOIN Ward w ON w.id = r.wardId
        WHERE r.electionYear = :year
          AND w.delimitationYear = :delimYear
          AND (:acCode IS NULL OR w.ac.acCode = :acCode)
          AND (:districtCode IS NULL OR w.localbody.district.districtCode = :districtCode)
          AND (:types IS NULL OR LOWER(w.localbody.type) IN :types)
    """)
    List<LbWardResult> findResultsByScope(
            @Param("year") int year,
            @Param("delimYear") int delimYear,
            @Param("acCode") Integer acCode,
            @Param("districtCode") Integer districtCode,
            @Param("types") List<String> types
    );

    @Query(value = """
        SELECT
            w.id            AS wardId,
            w.ward_num      AS wardNum,
            w.ward_name     AS wardName,
            lb.id           AS localbodyId,
            lb.name         AS localbodyName,
            lb.type         AS localbodyType,
            lb.district_code AS districtCode,
            c.party_id      AS partyId,
            r.votes         AS votes
        FROM lb_ward_results r
        JOIN ward w ON w.id = r.ward_id
        JOIN localbody lb ON lb.id = w.localbody_id
        JOIN lb_candidate c ON c.id = r.candidate_id
        WHERE r.election_year = :year
          AND (:acCode IS NULL OR w.ac_code = :acCode)
          AND (:districtCode IS NULL OR lb.district_code = :districtCode)
          AND (:types IS NULL OR lower(lb.type) = ANY(:types))
        """,
            nativeQuery = true)
    Stream<VoteRow> streamVotes(
            @Param("year") int year,
            @Param("acCode") Integer acCode,
            @Param("districtCode") Integer districtCode,
            @Param("types") String[] types
    );

    @Query("""
select
  w.id as wardId,
  w.wardNum as wardNum,
  w.wardName as wardName,
  lb.id as localbodyId,
  lb.name as localbodyName,
  ac.acCode as acCode,
  p.id as partyId,
  r.votes as votes
from LbWardResult r,
     Ward w,
     Candidate c
join w.localbody lb
join w.ac ac
join c.party p
where w.id = r.wardId
  and c.id = r.candidateId
  and r.electionYear = :year
  and (:districtCode is null or ac.district.districtCode = :districtCode)
  and (:localbodyTypes is null or lower(lb.type) in :localbodyTypes)
""")
    Stream<VoteRow> streamVotesForAssemblyOverview(
            int year,
            Integer districtCode,
            String[] localbodyTypes
    );


}