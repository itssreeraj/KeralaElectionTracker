package com.keralavotes.election.constants;

import com.keralavotes.election.dto.ElectionType;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public enum ElectionYear {

    // LOKSABHA
    LS_2009(2009, ElectionType.LOKSABHA, "2009 General Election"),
    LS_2014(2014, ElectionType.LOKSABHA, "2014 General Election"),
    LS_2019(2019, ElectionType.LOKSABHA, "2019 General Election"),
    LS_2024(2024, ElectionType.LOKSABHA, "2024 General Election"),

    // LOCALBODY
    LB_2015(2015, ElectionType.LOCALBODY, "2015 Localbody Election"),
    LB_2020(2020, ElectionType.LOCALBODY, "2020 Localbody Election"),
    LB_2025(2025, ElectionType.LOCALBODY, "2025 Localbody Election"),

    // ASSEMBLY
    AE_2011(2011, ElectionType.ASSEMBLY, "2011 Assembly Election"),
    AE_2016(2016, ElectionType.ASSEMBLY, "2016 Assembly Election"),
    AE_2021(2021, ElectionType.ASSEMBLY, "2021 Assembly Election"),
    AE_2026(2026, ElectionType.ASSEMBLY, "2026 Assembly Election");

    private final int year;
    private final ElectionType type;
    private final String label;

    ElectionYear(int year, ElectionType type, String label) {
        this.year = year;
        this.type = type;
        this.label = label;
    }

    public int getYear() {
        return year;
    }

    public ElectionType getType() {
        return type;
    }

    public String getLabel() {
        return label;
    }

    /* ===================== LOOKUPS ===================== */

    private static final Map<Integer, ElectionYear> BY_YEAR =
            Arrays.stream(values())
                    .collect(Collectors.toMap(ElectionYear::getYear, e -> e));

    public static ElectionYear fromYear(int year) {
        return BY_YEAR.get(year);
    }

    public static ElectionType typeOf(int year) {
        ElectionYear e = fromYear(year);
        return e != null ? e.getType() : null;
    }

    public static String labelOf(int year) {
        ElectionYear e = fromYear(year);
        return e != null ? e.getLabel() : null;
    }

    public static List<ElectionYear> byType(ElectionType type) {
        return Arrays.stream(values())
                .filter(e -> e.type == type)
                .sorted(Comparator.comparingInt(ElectionYear::getYear))
                .toList();
    }

    public boolean isGeneral() {
        return type == ElectionType.LOKSABHA || type == ElectionType.ASSEMBLY;
    }

    public boolean isLocalbody() {
        return type == ElectionType.LOCALBODY;
    }

}

