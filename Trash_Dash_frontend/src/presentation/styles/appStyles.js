// Presentation layer: stylesheet React Native dell'app.
import { StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    gameplayInstructionBox: {
    backgroundColor: "#0F172A",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#4ADE80",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 10,
  },

plantRunnerStage: {
  height: 252,
  marginHorizontal: 20,
  marginTop: "auto",
  marginBottom: 24,
  overflow: "hidden",
  justifyContent: "flex-end",
  position: "relative",
  borderRadius: 22,
  borderWidth: 1,
  borderColor: "rgba(34, 211, 238, 0.24)",
  backgroundColor: "rgba(3, 20, 34, 0.32)",
},

miniRunnerDragonTouchArea: {
  position: "absolute",
  left: 2,
  bottom: 18,
  width: 138,
  height: 118,
  zIndex: 8,
  justifyContent: "flex-end",
  alignItems: "center",
},

plantRunnerCharacter: {
  width: 132,
  height: 112,
  alignItems: "center",
  justifyContent: "flex-end",
},

runnerDinoBodyWrap: {
  width: 116,
  height: 108,
  zIndex: 3,
},

runnerDragonImage: {
  width: "100%",
  height: "100%",
},

plantRunnerGroundLine: {
  position: "absolute",
  left: 18,
  right: 18,
  bottom: 34,
  height: 3,
  borderRadius: 999,
  backgroundColor: "rgba(34, 211, 238, 0.24)",
},

runnerGroundShadow: {
  position: "absolute",
  left: 44,
  bottom: 28,
  width: 74,
  height: 12,
  borderRadius: 999,
  backgroundColor: "#000000",
},

miniRunnerScorePill: {
  position: "absolute",
  right: 14,
  top: 10,
  color: "#FDE68A",
  fontSize: 14,
  fontWeight: "900",
  zIndex: 6,
  backgroundColor: "rgba(15, 23, 42, 0.72)",
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderWidth: 1,
  borderColor: "rgba(253, 230, 138, 0.32)",
},

miniRunnerBestStatsBox: {
  position: "absolute",
  left: 12,
  top: 10,
  zIndex: 7,
  backgroundColor: "rgba(15, 23, 42, 0.76)",
  borderRadius: 14,
  paddingHorizontal: 9,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: "rgba(34, 211, 238, 0.32)",
  maxWidth: 150,
},

miniRunnerBestStatsTitle: {
  color: "#67E8F9",
  fontSize: 10,
  fontWeight: "900",
  marginBottom: 1,
  letterSpacing: 0.4,
},

miniRunnerBestStatsText: {
  color: "#E0F2FE",
  fontSize: 10,
  lineHeight: 13,
  fontWeight: "800",
},

miniRunnerLiveStatsBox: {
  position: "absolute",
  right: 14,
  top: 10,
  zIndex: 7,
  backgroundColor: "rgba(15, 23, 42, 0.76)",
  borderRadius: 14,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderWidth: 1,
  borderColor: "rgba(253, 230, 138, 0.36)",
  alignItems: "flex-end",
  minWidth: 86,
},

miniRunnerLiveStatsText: {
  color: "#FDE68A",
  fontSize: 11,
  lineHeight: 14,
  fontWeight: "900",
},

miniRunnerStartHint: {
  position: "absolute",
  left: 118,
  right: 16,
  top: 58,
  color: "rgba(248, 250, 252, 0.78)",
  fontSize: 12,
  fontWeight: "800",
  textAlign: "center",
  zIndex: 5,
},

miniRunnerGameOverBadge: {
  position: "absolute",
  left: 116,
  right: 16,
  top: 60,
  borderRadius: 16,
  backgroundColor: "rgba(127, 29, 29, 0.72)",
  borderWidth: 1,
  borderColor: "rgba(248, 113, 113, 0.65)",
  paddingVertical: 7,
  paddingHorizontal: 10,
  alignItems: "center",
  zIndex: 6,
},

miniRunnerGameOverTitle: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "900",
  letterSpacing: 0.8,
},

miniRunnerGameOverText: {
  color: "#FECACA",
  fontSize: 10,
  fontWeight: "800",
  marginTop: 2,
},

miniRunnerObstacle: {
  position: "absolute",
  bottom: 35,
  borderRadius: 7,
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.3)",
  zIndex: 4,
},

  greenhouseBackgroundLayer: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "#03111E",
},
greenhouseSvgBackdrop: {
  ...StyleSheet.absoluteFillObject,
},
greenhouseSvgBackdropMuted: {
  opacity: 0.62,
},
greenhouseVignetteLayer: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(2, 8, 23, 0.18)",
},
greenhouseMutedOverlayLayer: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(3, 12, 24, 0.56)",
},
screenForegroundLayer: {
  flex: 1,
  zIndex: 2,
},
  showcaseItemVisualWrap: {
  width: 96,
  height: 96,
  alignItems: "center",
  justifyContent: "center",
},
  gameplayInstructionText: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  particleContainerLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 4,
  },
  starPosition: {
    position: "absolute",
    fontSize: 22,
    zIndex: 5,
  },
  container: {
  flex: 1,
  backgroundColor: "#03111E",
  paddingTop: StatusBar.currentHeight || 16,
  position: "relative",
  overflow: "hidden",
},
  keyboardAvoidingScreen: {
    flex: 1,
  },
  innerAuthLayout: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
 brandTitle: {
  fontSize: 52,
  fontWeight: "900",
  textAlign: "center",
  color: "#FFF7D6",
  letterSpacing: 0.8,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 5 },
  textShadowRadius: 8,
},

 brandSubtitle: {
  color: "#D9F99D",
  textAlign: "center",
  fontSize: 15,
  marginBottom: 32,
  fontWeight: "700",
  textShadowColor: "rgba(0,0,0,0.65)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
},
  authFormCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#334155",
  },
 formHeadline: {
  fontSize: 30,
  fontWeight: "900",
  color: "#FFF7D6",
  textAlign: "center",
  marginBottom: 22,
  letterSpacing: 1,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 7,
},
  inputWrapper: {
    marginBottom: 14,
    width: "100%",
  },
  inputLabel: {
    color: "#94A3B8",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
  },
  inputFieldMock: {
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#475569",
    paddingHorizontal: 14,
    backgroundColor: "#1E293B",
    color: "#F8FAFC",
  },
  authButtonsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 18,
  },
  authFeedbackArea: {
    width: "100%",
    minHeight: 30,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  authFeedbackText: {
    width: "100%",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  authErrorText: {
    color: "#FCA5A5",
  },
  authNoticeText: {
    color: "#BBF7D0",
  },
  guestLinkText: {
    color: "#38BDF8",
    textAlign: "center",
    fontWeight: "700",
    textDecorationLine: "underline",
    marginTop: 20,
    fontSize: 15,
  },
  headerBar: {
  paddingHorizontal: 16,
  paddingVertical: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottomWidth: 0,
  borderBottomColor: "rgba(34, 211, 238, 0.42)",
  backgroundColor: "rgba(3, 20, 34, 0.76)",
},
 coinsCounterText: {
  color: "#FDE68A",
  fontWeight: "900",
  fontSize: 17,
  textShadowColor: "rgba(0,0,0,0.65)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
},
 powerExitButton: {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(239, 27, 36, 0.12)",
  borderWidth: 1.2,
  borderColor: "rgba(255,255,255,0.24)",
  shadowOpacity: 0,
  elevation: 0,
},
 logoutButton: {
  backgroundColor: "#EF4444",
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.35)",
  shadowColor: "#000",
  shadowOpacity: 0.35,
  shadowRadius: 6,
  elevation: 5,
},
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
 menuBody: {
  flex: 1,
  justifyContent: "center",
  paddingHorizontal: 32,
  paddingBottom: 28,
},
hugeMenuLogo: {
  fontSize: 54,
  fontWeight: "900",
  textAlign: "center",
  color: "#FFF7D6",
  marginBottom: 38,
  letterSpacing: 0.8,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 5 },
  textShadowRadius: 8,
},
  menuNavButton: {
    marginVertical: 8,
    width: "100%",
  },
  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  halfMenuButton: {
    flex: 1,
  },
  locationConsentOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    backgroundColor: "rgba(2, 8, 23, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  locationConsentCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(6, 32, 48, 0.96)",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.78)",
    padding: 18,
  },
  locationConsentTitle: {
    color: "#FFF7D6",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 22,
    lineHeight: 27,
    marginBottom: 10,
    textShadowColor: "rgba(73, 38, 0, 0.85)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 5,
  },
  locationConsentBody: {
    color: "#DDEAF6",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  locationConsentButtonsColumn: {
    gap: 9,
  },
  locationConsentButton: {
    width: "100%",
    height: 46,
  },
  locationConsentButtonText: {
    fontSize: 13,
  },
  locationConsentNeverButton: {
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    borderColor: "#64748B",
  },
  goBackButton: {
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderWidth: 2,
  borderColor: "#22D3EE",
  borderRadius: 12,
  backgroundColor: "rgba(4, 47, 74, 0.86)",
},
  goBackButtonText: {
  color: "#F8FAFC",
  fontWeight: "900",
  textShadowColor: "rgba(0,0,0,0.55)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
},
  centralPanel: {
  margin: 20,
  padding: 20,
  backgroundColor: "rgba(6, 32, 48, 0.82)",
  borderRadius: 24,
  borderWidth: 2,
  borderColor: "rgba(34, 211, 238, 0.65)",
  shadowColor: "#000",
  shadowOpacity: 0.32,
  shadowRadius: 10,
  elevation: 6,
},
 panelTitleText: {
  fontSize: 34,
  fontWeight: "900",
  color: "#FFF7D6",
  textAlign: "center",
  marginBottom: 24,
  letterSpacing: 1.2,
  textShadowColor: "rgba(73, 38, 0, 0.95)",
  textShadowOffset: { width: 0, height: 4 },
  textShadowRadius: 7,
},
  diffSelectorBtn: {
    marginVertical: 8,
  },
  fancyButton: {
  backgroundColor: "rgba(5, 54, 91, 0.96)",
  borderRadius: 22,
  height: 52,
  paddingHorizontal: 14,
  borderWidth: 2,
  borderColor: "#22D3EE",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.34,
  shadowRadius: 8,
  elevation: 5,
},
  fancyButtonActive: {
  backgroundColor: "rgba(8, 95, 112, 0.98)",
  borderColor: "#67E8F9",
},
  fancyButtonDisabled: {
    opacity: 0.4,
    backgroundColor: "#64748B",
    borderColor: "#475569",
  },
  fancyButtonSmall: {
  height: 42,
  paddingHorizontal: 10,
  borderRadius: 18,
},
  fancyButtonText: {
  color: "#FFFFFF",
  fontSize: 16,
  fontWeight: "900",
  textAlign: "center",
  letterSpacing: 0.6,
  textShadowColor: "rgba(0,0,0,0.75)",
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 3,
},
  fancyButtonTextSmall: {
    fontSize: 12,
  },
  fancyButtonTextActive: {
    color: "#E2E8F0",
  },
  gameStatsHeader: {
  paddingHorizontal: 14,
  paddingVertical: 12,
  backgroundColor: "rgba(3, 20, 34, 0.76)",
  borderBottomWidth: 2,
  borderBottomColor: "rgba(34, 211, 238, 0.42)",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "700",
  },
  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 10,
  },
  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "700",
    fontSize: 13,
  },
  boldYellow: {
    color: "#F59E0B",
  },
  gameplayScrollView: {
    flex: 1,
  },
  gameplayScrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
  },
  treeCard: {
    borderRadius: 24,
    padding: 12,
    minHeight: 118,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  absoluteCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  treeMoodText: {
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
    zIndex: 2,
    color: "#F8FAFC",
  },
  treeGraphicsContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  mainTreeEmoji: {
    fontSize: 48,
  },
  draggableAreaContainer: {
    height: 126,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "visible",
    zIndex: 30,
    elevation: 12,
  },
  interactiveWasteCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },
  wasteMeasureBox: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 34,
    elevation: 10,
  },
  wasteDragHandle: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 36,
    elevation: 12,
    backfaceVisibility: "hidden",
  },
  wasteDragHandleActive: {
    zIndex: 40,
    elevation: 16,
  },
  wasteLargeIcon: {
    fontSize: 48,
    padding: 10,
  },
  wasteNameTitle: {
    width: "100%",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 4,
    textAlign: "center",
  },
  binsInteractiveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    zIndex: 1,
    elevation: 1,
  },
  interactiveBinItem: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    marginBottom: 12,
    zIndex: 1,
  },
  interactiveBinItemDropReady: {
    elevation: 8,
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  binFullTouch: {
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 84,
  },
  binLabelOnlyText: {
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fullOverlayScreen: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(3,12,24,0.72)",
  justifyContent: "center",
  padding: 24,
  zIndex: 999,
},
  pauseMenuPanel: {
  backgroundColor: "rgba(6, 32, 48, 0.92)",
  borderRadius: 24,
  padding: 24,
  borderWidth: 2,
  borderColor: "rgba(34, 211, 238, 0.75)",
},
  pauseMenuTitleText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 20,
  },
  pauseMenuButton: {
    marginVertical: 8,
  },
  abandonConfirmSubRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  halfAbandonBtn: {
    flex: 1,
    backgroundColor: "#475569",
    borderColor: "#64748B",
  },
  resultContainerContent: {
    padding: 16,
  },
  resultOutcomeCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 16,
  },
  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },
  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },
  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  centerShowcaseItemBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "relative",
    overflow: "hidden",
  },
  weatherFXParticle: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 4,
    zIndex: 2,
  },
  showcaseItemEmoji: {
    fontSize: 64,
    zIndex: 2,
  },
  outcomeActionBtn: {
    width: "90%",
    marginVertical: 6,
    backgroundColor: "#1E293B",
    borderColor: "#475569",
  },
  educationalReportBox: {
  backgroundColor: "rgba(6, 32, 48, 0.84)",
  borderRadius: 20,
  padding: 18,
  borderWidth: 1,
  borderColor: "rgba(34, 211, 238, 0.42)",
},
  educationalHeadline: {
    fontSize: 16,
    fontWeight: "900",
    color: "#38BDF8",
    textAlign: "center",
    marginBottom: 12,
  },
  cleanReportText: {
    color: "#F8FAFC",
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
  errorReportItemRow: {
    marginVertical: 6,
  },
  errorReportTextBullet: {
    color: "#CBD5E1",
    fontWeight: "500",
    lineHeight: 20,
  },
  boldBlue: {
    color: "#38BDF8",
    fontWeight: "800",
  },
  globalBadgeHeader: {
    fontSize: 16,
    color: "#38BDF8",
    fontWeight: "800",
  },
  leaderboardItemRow: {
  flexDirection: "row",
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 12,
  marginVertical: 4,
  alignItems: "center",
},
  leaderboardRankText: {
    color: "#4ADE80",
    fontWeight: "900",
    width: 28,
  },
  leaderboardNameText: {
    color: "#F8FAFC",
    fontWeight: "700",
    flex: 1,
  },
  leaderboardPointsText: {
    color: "#94A3B8",
    fontWeight: "600",
  },
  userPersonalRankCard: {
    marginTop: 20,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4ADE80",
    padding: 16,
    alignItems: "center",
  },
  personalTitleLabel: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4ADE80",
  },
  personalRankPosText: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 2,
  },
  personalUsernameText: {
    color: "#94A3B8",
    fontWeight: "500",
  },
  personalScoreText: {
    color: "#F59E0B",
    fontWeight: "900",
    fontSize: 15,
  },
 settingToggleItemRow: {
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  borderRadius: 16,
  padding: 12,
  marginVertical: 6,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
  locationStatusInfoBox: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.72)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  locationStatusInfoText: {
    color: "#CBD5E1",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  disconnectButton: {
  marginTop: 18,
  backgroundColor: "#EF4444",
  borderRadius: 18,
  paddingVertical: 13,
  paddingHorizontal: 16,
  borderWidth: 2,
  borderColor: "rgba(255,255,255,0.35)",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOpacity: 0.28,
  shadowRadius: 6,
  elevation: 5,
},
  disconnectButtonText: {
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: "900",
  textAlign: "center",
  letterSpacing: 0.4,
},
  settingItemLabelText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  toggleButtonsGroupContainer: {
    flexDirection: "row",
    gap: 4,
  },
  toggleBlockItem: {
    width: 44,
    height: 34,
    borderWidth: 1,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#0F172A",
  },
  toggleBlockItemActive: {
    backgroundColor: "#10B981",
    borderColor: "#34D399",
  },
  toggleBlockText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
  },
  toggleBlockTextActive: {
    color: "#FFFFFF",
  },
  languageDropdownAnchorTrigger: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  languageDropdownAnchorText: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  languageFloatingMenuOptionsContainer: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#475569",
    marginTop: 4,
    overflow: "hidden",
  },
  languageMenuOptionItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#334155",
  },
  languageMenuOptionItemText: {
    color: "#F8FAFC",
    fontWeight: "600",
    textAlign: "center",
  },
  shopScrollLayout: {
    padding: 16,
  },
 shopItemCardRow: {
  backgroundColor: "rgba(6, 32, 48, 0.84)",
  borderRadius: 24,
  borderWidth: 2,
  padding: 16,
  marginVertical: 10,
  flexDirection: "row",
  gap: 16,
  alignItems: "center",
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 4,
},
  shopItemIconPreviewBox: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden",
  },
  shopItemLargeEmoji: {
    fontSize: 42,
    zIndex: 2,
  },
  shopItemMetaDetailsInfo: {
    flex: 1,
  },
  shopItemNameText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  shopItemSubMetaText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
    marginVertical: 1,
  },
  shopDualButtonsRowContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
    width: "100%",
  },
  shopLeftButtonSlot: {
    flex: 1.3,
    justifyContent: "center",
  },
  shopRightButtonSlot: {
    flex: 1,
    justifyContent: "center",
  },
  shopItemMainActionButton: {
    width: "100%",
    height: 38,
  },
 alreadyBoughtBadge: {
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  borderRadius: 16,
  height: 38,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#334155",
  width: "100%",
},
  alreadyBoughtText: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "700",
  },
 multiplayerActionCardBox: {
  backgroundColor: "rgba(15, 46, 65, 0.88)",
  borderRadius: 18,
  borderWidth: 1,
  borderColor: "#334155",
  padding: 14,
  marginVertical: 8,
},
  multiplayerSectionTitleText: {
    textAlign: "center",
    fontWeight: "800",
    color: "#38BDF8",
    fontSize: 15,
    marginBottom: 10,
  },
  lobbyCodeGeneratedDisplay: {
    textAlign: "center",
    color: "#F8FAFC",
    fontWeight: "700",
    marginTop: 10,
  },
  lobbyStatusMessageText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  inputFriendCodeLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 6,
  },
  lobbyCodeInputField: {
    backgroundColor: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#475569",
    borderRadius: 10,
    color: "#F8FAFC",
    paddingHorizontal: 12,
    height: 40,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 10,
  },
  battleWinnerAnnouncementCard: {
    borderWidth: 2,
    borderColor: "#F59E0B",
    backgroundColor: "#78350F",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  crownCelebrationIcon: {
    fontSize: 36,
  },
  winnerNameAnnouncementText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginVertical: 4,
  },
  battleVersusScoreboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 12,
  },
  versusPlayerStatsColumn: {
    alignItems: "center",
  },
  versusPlayerNameText: {
    color: "#E2E8F0",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  versusPlayerPointsValue: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },
  vsCentralLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F59E0B",
  },
  tdWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  tdWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.18)",
    transform: [{ rotate: "-8deg" }],
  },
  tdWindLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  tdWindLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  cinSoftGlow: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "8%",
    height: "22%",
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.16)",
  },
  cinWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  cinWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.16)",
    transform: [{ rotate: "14deg" }],
  },
  cinLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },
  cinLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.36)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinTreeCard: {
    overflow: "hidden",
    shadowColor: "#22C55E",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  cinTreeAura: {
    position: "absolute",
    width: 138,
    height: 138,
    borderRadius: 999,
    backgroundColor: "rgba(74, 222, 128, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(187, 247, 208, 0.22)",
  },
  treeFeedbackHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    zIndex: 2,
  },
  cinTreeParticleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  cinTreeParticle: {
    color: "#ECFCCB",
    textShadowColor: "rgba(187, 247, 208, 0.46)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinResultBox: {
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  cinResultBoxVictory: {
    backgroundColor: "#052E1A",
    borderColor: "#86EFAC",
  },
  cinResultBoxDefeat: {
    backgroundColor: "#2A1018",
    borderColor: "#FB7185",
  },
  cinResultAura: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(187, 247, 208, 0.12)",
  },
  cinResultParticleLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  cinResultParticle: {
    color: "#ECFCCB",
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  // PATCH MENU SENZA BARRA
  headerBar: {
    position: "absolute",
    top: 52,
    left: 26,
    right: 26,
    zIndex: 50,
    elevation: 50,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },
  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.08)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  // PATCH SFONDO LEGGERO
  cinWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  cinWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.13)",
    transform: [{ rotate: "14deg" }],
  },
  cinLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },
  cinLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  // PATCH PIOGGIA VERTICALE
  cinRainDrop: {
    width: 1.4,
    borderRadius: 999,
    backgroundColor: "rgba(147, 197, 253, 0.72)",
    shadowColor: "#BAE6FD",
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
  cinVictoryParticle: {
    color: "#ECFCCB",
    fontSize: 16,
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinResultBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 7,
  },
  cinResultBoxVictory: {
    borderColor: "#34D399",
    borderWidth: 3,
    backgroundColor: "#052E1A",
  },
  cinResultBoxDefeat: {
    borderColor: "#F87171",
    borderWidth: 3,
    backgroundColor: "#1F0F19",
  },
  // PATCH MENU: più omogeneo, bottoni leggermente più in alto
  menuBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 54,
    paddingBottom: 118,
  },
  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 30,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },
  menuNavButton: {
    marginVertical: 7,
    width: "100%",
  },
  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  // PATCH HEADER MENU: saldo e uscita più interni, nessuna barra
  headerBar: {
    position: "absolute",
    top: 56,
    left: 28,
    right: 28,
    zIndex: 50,
    elevation: 50,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },
  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.32)",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.08)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  // PATCH HEADER PARTITA: nessuna barra, contenuti dentro il contorno
  gameStatsHeader: {
    marginTop: 52,
    marginHorizontal: 28,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },
  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.28)",
  },
  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "800",
    fontSize: 15,
  },
  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },
  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // PATCH ANIMAZIONI SFONDO
  cinWindLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  cinWindLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.13)",
    transform: [{ rotate: "14deg" }],
  },
  cinLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },
  cinLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  // PATCH PIOGGIA SCONFITTA
  cinRainDrop: {
    borderRadius: 999,
    backgroundColor: "rgba(147, 197, 253, 0.78)",
    shadowColor: "#BAE6FD",
    shadowOpacity: 0.24,
    shadowRadius: 3,
  },
  cinVictoryParticle: {
    color: "#ECFCCB",
    fontSize: 16,
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  cinResultBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 18,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 7,
  },
  cinResultBoxVictory: {
    borderColor: "#34D399",
    borderWidth: 3,
    backgroundColor: "#052E1A",
  },
  cinResultBoxDefeat: {
    borderColor: "#F87171",
    borderWidth: 3,
    backgroundColor: "#1F0F19",
  },
  // ==========================================================
  // PATCH FINALE LAYOUT OMOGENEO TRASHDASH
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header generale usato da Menu, Shop, Settings, Leaderboard, Difficulty.
  // Sta dentro il bordo dello sfondo, non tocca più gli angoli.
  headerBar: {
    position: "absolute",
    top: 54,
    left: 30,
    right: 30,
    minHeight: 52,
    zIndex: 80,
    elevation: 80,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.56)",
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 5,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.36)",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  // Menu principale: componenti più raccolti e omogenei.
  menuBody: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 72,
    paddingBottom: 108,
  },

  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 30,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 7,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },

  // Pannelli interni: lasciano lo spazio giusto sopra per il bottone Menu.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 124,
    marginBottom: 22,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Shop: stesso criterio di allineamento degli altri schermi.
  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 120,
    paddingBottom: 28,
  },

  // Header partita: dentro il contorno, senza barra orizzontale.
  gameStatsHeader: {
    marginTop: 54,
    marginHorizontal: 28,
    marginBottom: 10,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 40,
    elevation: 40,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.32)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Risultato: elimina il rettangolo vuoto sopra rosso/verde.
  resultContainerContent: {
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },

  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },

  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },

  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 0,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1.2,
  },

  outcomeActionBtn: {
    width: "90%",
    marginVertical: 6,
    backgroundColor: "#1E293B",
    borderColor: "#475569",
  },

  centerShowcaseItemBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },

  educationalReportBox: {
    backgroundColor: "rgba(6, 32, 48, 0.84)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.42)",
    marginBottom: 24,
  },
  // ==========================================================
  // PATCH HEADER ALTI E LAYOUT PIÙ COMPATTO
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header generale: Menu, Global, Balance, Power.
  headerBar: {
    position: "absolute",
    top: 28,
    left: 30,
    right: 30,
    minHeight: 48,
    zIndex: 100,
    elevation: 100,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.58)",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.34)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  // Menu principale: logo e bottoni salgono davvero.
  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 132,
    paddingBottom: 60,
  },

  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 6,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  halfMenuButton: {
    flex: 1,
  },

  // Pannelli interni: titolo/pulsanti più in alto, ma senza sovrapporsi al Menu.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 84,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginBottom: 22,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 86,
    paddingBottom: 28,
  },

  // Header partita: Pause / Lives / Points / Time più in alto e dentro il bordo.
  gameStatsHeader: {
    marginTop: 28,
    marginHorizontal: 30,
    marginBottom: 8,
    minHeight: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.32)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Risultato: rosso/verde parte più su, senza rettangolo vuoto evidente sopra.
  resultContainerContent: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },

  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },

  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },

  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 0,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  // ==========================================================
  // PATCH: TUTTO L'HEADER SOPRA L'ARCO DELLO SFONDO
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header comune: Menu, Saldo/Balance, Global, uscita.
  // Posizionato molto in alto, sopra l'arco dello sfondo.
  headerBar: {
    position: "absolute",
    top: 18,
    left: 30,
    right: 30,
    minHeight: 48,
    zIndex: 120,
    elevation: 120,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.62)",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 17,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  // Menu principale: Saldo e uscita sopra l'arco, logo subito sotto.
  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 118,
    paddingBottom: 56,
  },

  hugeMenuLogo: {
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 6,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  halfMenuButton: {
    flex: 1,
  },

  // Titoli schermate: sopra l'arco, subito sotto header.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 72,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 20,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Shop: bottone Menu + Saldo sopra l'arco, titolo Negozio sopra l'arco.
  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 78,
    paddingBottom: 28,
  },

  shopTitleText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 22,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Leaderboard / Difficulty / Settings con stesso criterio.
  leaderboardScrollLayout: {
    paddingHorizontal: 18,
    paddingTop: 78,
    paddingBottom: 28,
  },

  difficultyContent: {
    paddingHorizontal: 22,
    paddingTop: 78,
    paddingBottom: 28,
  },

  settingsContent: {
    paddingHorizontal: 20,
    paddingTop: 78,
    paddingBottom: 28,
  },

  // Header partita: Pausa, Vite, Punti, Tempo sopra l'arco.
  gameStatsHeader: {
    marginTop: 18,
    marginHorizontal: 30,
    marginBottom: 8,
    minHeight: 46,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 120,
    elevation: 120,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(2, 12, 22, 0.35)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Ridistribuzione partita: il contenuto sale quanto basta dopo header alto.
  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  // Risultato: riquadro rosso/verde parte subito, senza fascia vuota.
  resultContainerContent: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },

  outcomeCardWin: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },

  outcomeCardLose: {
    backgroundColor: "#7F1D1D",
    borderColor: "#F87171",
  },

  outcomeTitleText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 0,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  // ==========================================================
  // PATCH DEFINITIVA: HEADER SOPRA L'ARCO + CLASSIFICA SCROLL
  // ==========================================================

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  // Header comune di Menu, Shop, Settings, Leaderboard, Difficulty.
  // Ancora più alto: sopra l'arco dello sfondo.
  headerBar: {
    position: "absolute",
    top: 4,
    left: 30,
    right: 30,
    minHeight: 46,
    zIndex: 150,
    elevation: 150,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 12,
    backgroundColor: "rgba(4, 47, 69, 0.62)",
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(2, 12, 22, 0.40)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  powerExitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.10)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  // Menu principale ancora più alto.
  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 88,
    paddingBottom: 46,
  },

  hugeMenuLogo: {
    fontSize: 52,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 22,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 5,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  halfMenuButton: {
    flex: 1,
  },

  // Schermate interne: titolo sopra l'arco.
  centralPanel: {
    marginHorizontal: 20,
    marginTop: 58,
    marginBottom: 20,
    padding: 20,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  panelTitleText: {
    fontSize: 33,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 18,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Shop come riferimento visivo: header in alto, contenuto parte subito sotto.
  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 80,
  },

  shopTitleText: {
    fontSize: 33,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 18,
    letterSpacing: 1.2,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  // Classifica: scroll come shop, mostra top 10 + card personale visibile.
  leaderboardScrollLayout: {
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 180,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 18,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 18,
    marginBottom: 42,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 18,
    marginBottom: 42,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    alignItems: "center",
  },

  // Difficulty / Settings con lo stesso allineamento superiore.
  difficultyContent: {
    paddingHorizontal: 22,
    paddingTop: 64,
    paddingBottom: 80,
  },

  settingsContent: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 90,
  },

  // Partita: Pausa, Vite, Punti, Tempo ancora più in alto.
  gameStatsHeader: {
    marginTop: 4,
    marginHorizontal: 30,
    marginBottom: 6,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 150,
    elevation: 150,
  },

  pauseTriggerBtn: {
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "rgba(2, 12, 22, 0.35)",
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseTriggerText: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  gameStatsRightGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 1,
  },

  gameStatsLabelText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  // Risultato: parte più in alto ma resta pulito.
  resultContainerContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  resultOutcomeCard: {
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 12,
    elevation: 8,
  },
  // ==========================================================
  // PATCH CLASSIFICA OTTIMIZZATA
  // ==========================================================

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 280,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 18,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardRowText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
  },

  leaderboardScoreText: {
    color: "#CBD5E1",
    fontWeight: "900",
    fontSize: 15,
  },

  leaderboardSelfCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 20,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
  },

  leaderboardBottomSpacer: {
    height: 180,
  },
  // ==========================================================
  // PATCH CLASSIFICA: BORDO BASSO SICURO
  // ==========================================================

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 360,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 18,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 20,
    marginBottom: 170,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.90)",
    alignItems: "center",
  },

  leaderboardSafeBottomSpacer: {
    height: 220,
  },
  // ==========================================================
  // ECO CITY ARCADE - STILE COERENTE RACCOLTA DIFFERENZIATA
  // ==========================================================

  ecoCitySoftGlow: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "9%",
    height: "20%",
    borderRadius: 999,
    backgroundColor: "rgba(45, 212, 191, 0.16)",
  },

  ecoCityBreezeLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },

  ecoCityBreezeLine: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(199, 242, 255, 0.13)",
    transform: [{ rotate: "14deg" }],
  },

  ecoCityLeafLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 1,
  },

  ecoCityLeaf: {
    color: "#BBF7D0",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  ecoResultBox: {
    width: "85%",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 12,
    elevation: 7,
  },

  ecoResultBoxVictory: {
    borderColor: "#34D399",
    borderWidth: 3,
    backgroundColor: "#064E3B",
  },

  ecoResultBoxDefeat: {
    borderColor: "#94A3B8",
    borderWidth: 3,
    backgroundColor: "#1E293B",
  },

  ecoCleanParticle: {
    color: "#DCFCE7",
    fontSize: 15,
    textShadowColor: "rgba(187, 247, 208, 0.42)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  ecoCosmeticFrame: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },

  ecoCosmeticGlow: {
    position: "absolute",
    width: "84%",
    height: "84%",
    borderRadius: 999,
    borderWidth: 1,
  },

  ecoCosmeticGlowClean: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderColor: "rgba(187, 247, 208, 0.30)",
  },

  ecoCosmeticGlowDirty: {
    backgroundColor: "rgba(100, 116, 139, 0.16)",
    borderColor: "rgba(148, 163, 184, 0.28)",
  },

  ecoCosmeticInner: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
    elevation: 8,
  },

  ecoCosmeticFallback: {
    textAlign: "center",
    textShadowColor: "rgba(187, 247, 208, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },

  // Card rifiuto più illustrata/premium senza cambiare posizione o drag.
  interactiveWasteCard: {
    backgroundColor: "rgba(12, 20, 35, 0.94)",
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 116,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    shadowColor: "#4ADE80",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },

  wasteLargeIcon: {
    fontSize: 58,
    padding: 10,
    textShadowColor: "rgba(187, 247, 208, 0.34)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  wasteNameTitle: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 20,
    textAlign: "center",
    letterSpacing: 0.4,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // Cestini: colori UNI più forti, bordo premium e ombra morbida.
  interactiveBinItem: {
    flex: 1,
    minHeight: 92,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    margin: 7,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  interactiveBinItemDropReady: {
    shadowColor: "#BBF7D0",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },

  binLabelText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 1.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.48)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // Shop: skin ecologiche con look più mobile premium.
  shopItemCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    backgroundColor: "rgba(6, 32, 48, 0.86)",
    shadowColor: "#000",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    elevation: 7,
    overflow: "hidden",
  },

  shopItemIconPreviewBox: {
    width: 104,
    height: 104,
    borderRadius: 24,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(187, 247, 208, 0.22)",
    overflow: "visible",
  },

  shopItemLargeEmoji: {
    fontSize: 52,
    textShadowColor: "rgba(187, 247, 208, 0.26)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },

  shopItemTitleText: {
    color: "#F8FAFC",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  shopItemMetaText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
  },

  // ==========================================================
  // RIPRISTINO STRUTTURA PARTITA/CASSONETTI
  // Fonte: App_backup_eco_city_arcade.js
  // Mantiene sfondo/smog/risultati Eco City, ma riporta layout partita.
  // ==========================================================

  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  treeMoodText: {
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
    zIndex: 2,
    color: "#F8FAFC",
  },

  treeGraphicsContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  mainTreeEmoji: {
    fontSize: 48,
  },

  interactiveWasteCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },

  wasteMeasureBox: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 34,
    elevation: 10,
  },

  wasteLargeIcon: {
    fontSize: 48,
    padding: 10,
  },

  wasteNameTitle: {
    width: "100%",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 4,
    textAlign: "center",
  },

  interactiveBinItem: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    marginBottom: 12,
    zIndex: 1,
  },

  interactiveBinItemDropReady: {
    elevation: 4,
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },

  // ==========================================================
  // RIPRISTINO STRUTTURA PARTITA/CASSONETTI
  // Fonte: App_backup_eco_city_arcade.js
  // Mantiene sfondo/smog/risultati Eco City, ma riporta layout partita.
  // ==========================================================

  treeCard: {
    borderRadius: 22,
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  treeMoodText: {
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 4,
    zIndex: 2,
    color: "#F8FAFC",
  },

  treeGraphicsContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  mainTreeEmoji: {
    fontSize: 48,
  },

  interactiveWasteCard: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "72%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4ADE80",
    elevation: 6,
    overflow: "visible",
    zIndex: 30,
  },

  wasteMeasureBox: {
    minWidth: 82,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 34,
    elevation: 10,
  },

  wasteLargeIcon: {
    fontSize: 48,
    padding: 10,
  },

  wasteNameTitle: {
    width: "100%",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 4,
    textAlign: "center",
  },

  interactiveBinItem: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 3,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    marginBottom: 12,
    zIndex: 1,
  },

  interactiveBinItemDropReady: {
    elevation: 4,
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  // ==========================================================
  // FIX DEFINITIVO CLASSIFICA + PERFORMANCE GAMEPLAY
  // ==========================================================

  leaderboardScrollViewFinal: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayoutFinal: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 520,
  },

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    zIndex: 10,
    elevation: 10,
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 520,
  },

  leaderboardListContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },

  leaderboardRow: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 22,
    marginBottom: 280,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    padding: 20,
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    alignItems: "center",
  },

  leaderboardPhoneNavSpacerFinal: {
    height: 340,
  },
  // ==========================================================
  // CLASSIFICA - FIX REALE E DEFINITIVO
  // ==========================================================

  tdLeaderboardScrollView: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },

  tdLeaderboardScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 620,
  },

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 620,
  },

  leaderboardScrollViewFinal: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },

  leaderboardScrollLayoutFinal: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 620,
  },

  leaderboardListContainer: {
    gap: 5,
    marginTop: 6,
    marginBottom: 12,
  },

  leaderboardRow: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardRowText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
  },

  leaderboardScoreText: {
    color: "#CBD5E1",
    fontWeight: "900",
    fontSize: 14,
  },

  leaderboardSelfCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  leaderboardYouCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  currentUserLeaderboardCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  userRankCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  personalScoreCard: {
    marginTop: 14,
    marginBottom: 320,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    transform: [{ translateY: -42 }],
  },

  tdLeaderboardRealBottomSpace: {
    height: 420,
  },

  leaderboardPhoneNavSpacerFinal: {
    height: 420,
  },

  leaderboardSafeBottomSpacer: {
    height: 420,
  },

  leaderboardBottomSpacer: {
    height: 420,
  },
  // ==========================================================
  // CLASSIFICA STRUTTURATA COME NEGOZIO
  // ==========================================================

  tdLeaderboardShopLikeScroll: {
    flex: 1,
    width: "100%",
  },

  tdLeaderboardShopLikeContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 420,
  },

  tdLeaderboardShopLikeSpacer: {
    height: 260,
  },

  leaderboardScrollView: {
    flex: 1,
    width: "100%",
  },

  leaderboardScrollLayout: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 420,
  },

  leaderboardScrollViewFinal: {
    flex: 1,
    width: "100%",
  },

  leaderboardScrollLayoutFinal: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 64,
    paddingBottom: 420,
  },

  leaderboardListContainer: {
    gap: 5,
    marginTop: 6,
    marginBottom: 16,
  },

  leaderboardRow: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leaderboardSelfCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  leaderboardYouCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  currentUserLeaderboardCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  userRankCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  personalScoreCard: {
    marginTop: 18,
    marginBottom: 90,
    borderWidth: 2,
    borderColor: "#4ADE80",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
  },

  // ==========================================================
  // FIX DEFINITIVO CLASSIFICA: stessa logica strutturale Shop
  // ==========================================================

  tdLeaderboardTopBarFixed: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },

  tdLeaderboardRealScroll: {
    flex: 1,
    width: "100%",
  },

  tdLeaderboardRealContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 190,
  },

  tdLeaderboardPanelFixed: {
    width: "100%",
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  tdLeaderboardRowsBoxFixed: {
    width: "100%",
    gap: 5,
  },

  tdLeaderboardAndroidBottomSpaceFixed: {
    height: 155,
  },

  globalBadgeHeader: {
    fontSize: 16,
    color: "#38BDF8",
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(2, 12, 24, 0.58)",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  leaderboardItemRow: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 46, 65, 0.88)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 13,
    marginVertical: 3,
    alignItems: "center",
    minHeight: 45,
  },

  leaderboardRankText: {
    color: "#4ADE80",
    fontWeight: "900",
    width: 30,
    fontSize: 15,
  },

  leaderboardNameText: {
    color: "#F8FAFC",
    fontWeight: "800",
    flex: 1,
    fontSize: 15,
  },

  leaderboardPointsText: {
    color: "#CBD5E1",
    fontWeight: "800",
    fontSize: 14,
  },

  userPersonalRankCard: {
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: "rgba(30, 41, 59, 0.96)",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4ADE80",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  personalTitleLabel: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4ADE80",
  },

  personalRankPosText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    marginTop: 2,
  },

  personalUsernameText: {
    color: "#94A3B8",
    fontWeight: "700",
    marginTop: 2,
  },

  personalScoreText: {
    color: "#F59E0B",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 2,
  },

  // ==========================================================
  // PATCH LAYOUT GENERALE OMOGENEO V2
  // ==========================================================

  container: {
    flex: 1,
    backgroundColor: "#03111E",
    paddingTop: 0,
    position: "relative",
    overflow: "hidden",
  },

  screenForegroundLayer: {
    flex: 1,
    position: "relative",
    zIndex: 2,
  },

  headerBar: {
    position: "absolute",
    top: 12,
    left: 30,
    right: 30,
    minHeight: 46,
    zIndex: 180,
    elevation: 180,
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "transparent",
  },

  goBackButton: {
    minWidth: 94,
    height: 42,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderWidth: 2,
    borderColor: "#22D3EE",
    borderRadius: 14,
    backgroundColor: "rgba(4, 47, 69, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  goBackButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  powerExitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 27, 36, 0.12)",
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  coinsCounterText: {
    color: "#FDE68A",
    fontWeight: "900",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "rgba(2, 12, 22, 0.48)",
    textShadowColor: "rgba(0,0,0,0.68)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  globalBadgeHeader: {
    color: "#38BDF8",
    fontWeight: "900",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "rgba(2, 12, 22, 0.48)",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 32,
    paddingTop: 96,
    paddingBottom: 26,
  },

  hugeMenuLogo: {
    fontSize: 50,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 26,
    letterSpacing: 0.7,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  fancyButton: {
    backgroundColor: "rgba(5, 54, 91, 0.96)",
    borderRadius: 20,
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#22D3EE",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 5,
  },

  menuNavButton: {
    marginVertical: 5,
    width: "100%",
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 13,
  },

  halfMenuButton: {
    flex: 1,
  },

  centralPanel: {
    marginHorizontal: 20,
    marginTop: 76,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  tdDifficultyPanel: {
    marginTop: 78,
    paddingTop: 26,
    paddingBottom: 26,
  },

  tdBattlePanel: {
    marginTop: 78,
    paddingTop: 24,
    paddingBottom: 24,
  },

  tdBattleEndPanel: {
    marginTop: 78,
    paddingTop: 24,
    paddingBottom: 24,
  },

  tdSettingsPanel: {
    marginTop: 78,
    paddingTop: 24,
    paddingBottom: 24,
  },

  panelTitleText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF7D6",
    textAlign: "center",
    marginTop: 0,
    marginBottom: 20,
    letterSpacing: 1.1,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 7,
  },

  diffSelectorBtn: {
    marginVertical: 7,
  },

  plantRunnerStage: {
    height: 268,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.24)",
    backgroundColor: "rgba(3, 20, 34, 0.32)",
  },

  settingToggleItemRow: {
    backgroundColor: "rgba(15, 46, 65, 0.88)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 5,
    minHeight: 58,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  settingItemLabelText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
  },

  toggleBlockItem: {
    width: 48,
    height: 34,
    borderWidth: 1,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9,
    backgroundColor: "#0F172A",
  },

  locationStatusInfoBox: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.72)",
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 10,
  },

  disconnectButton: {
    marginTop: 17,
    height: 52,
    backgroundColor: "#EF4444",
    borderRadius: 18,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },

  multiplayerActionCardBox: {
    backgroundColor: "rgba(15, 46, 65, 0.88)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginVertical: 7,
  },

  multiplayerSectionTitleText: {
    textAlign: "center",
    fontWeight: "900",
    color: "#38BDF8",
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  lobbyCodeInputField: {
    backgroundColor: "#0F172A",
    borderWidth: 1.5,
    borderColor: "#475569",
    borderRadius: 11,
    color: "#F8FAFC",
    paddingHorizontal: 12,
    height: 42,
    textAlign: "center",
    fontWeight: "800",
    marginBottom: 10,
  },

  shopScrollLayout: {
    paddingHorizontal: 16,
    paddingTop: 76,
    paddingBottom: 90,
  },

  tdLeaderboardTopBarFixed: {
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
    elevation: 20,
  },

  tdLeaderboardRealContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 210,
  },

  tdLeaderboardPanelFixed: {
    width: "100%",
    backgroundColor: "rgba(6, 32, 48, 0.82)",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.65)",
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 6,
  },

  tdLeaderboardAndroidBottomSpaceFixed: {
    height: 150,
  },

  resultContainerContent: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 44,
  },

  // FINE PATCH LAYOUT GENERALE OMOGENEO V2

  // ==========================================================
  // PATCH MENU PRINCIPALE PREMIUM
  // ==========================================================

  menuBody: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 30,
    paddingTop: 88,
    paddingBottom: 28,
  },

  hugeMenuLogo: {
    fontSize: 58,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 24,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  menuNavButton: {
    marginVertical: 4,
    width: "100%",
  },

  menuPrimaryButton: {
    minHeight: 60,
    borderRadius: 22,
    borderWidth: 2.4,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },

  menuFooterRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 14,
  },

  halfMenuButton: {
    flex: 1,
  },

  menuSecondaryButton: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.92)",
    backgroundColor: "rgba(4, 47, 69, 0.88)",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 5,
  },

  fancyButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // FINE PATCH MENU PRINCIPALE PREMIUM

  // ==========================================================
  // PATCH MENU PRINCIPALE REALE
  // ==========================================================

  tdMenuTopBar: {
    position: "absolute",
    top: 12,
    left: 30,
    right: 30,
    minHeight: 46,
    zIndex: 200,
    elevation: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },

  tdMenuBodyPremium: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 92,
    paddingBottom: 26,
    justifyContent: "flex-start",
  },

  tdMenuLogoPremium: {
    fontSize: 58,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFF7D6",
    marginBottom: 28,
    letterSpacing: 0.8,
    textShadowColor: "rgba(73, 38, 0, 0.95)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 8,
  },

  tdMenuPrimaryGroup: {
    width: "100%",
    gap: 9,
  },

  tdMenuButtonBase: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  tdMenuPrimaryButton: {
    height: 63,
    borderRadius: 23,
    borderWidth: 2.6,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.28,
    shadowRadius: 13,
    elevation: 9,
  },

  tdMenuPrimaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2.4,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  tdMenuSecondaryRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 16,
  },

  tdMenuSecondaryButton: {
    flex: 1,
    height: 53,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(34, 211, 238, 0.92)",
    backgroundColor: "rgba(4, 47, 69, 0.88)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 6,
  },

  tdMenuSecondaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 2.1,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.66)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  // FINE PATCH MENU PRINCIPALE REALE

  // ==========================================================
  // PATCH BOTTONI SCHERMATE PREMIUM
  // ==========================================================

  // --------------------------
  // DIFFICOLTÀ
  // --------------------------

  tdDifficultyPanel: {
    marginTop: 76,
    paddingTop: 26,
    paddingBottom: 26,
  },

  diffSelectorBtn: {
    marginVertical: 7,
  },

  tdDifficultyPremiumButton: {
    minHeight: 61,
    borderRadius: 22,
    borderWidth: 2.6,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.27,
    shadowRadius: 13,
    elevation: 9,
  },

  // NON toccare questo: il minigioco resta con struttura stabile.
  plantRunnerStage: {
    height: 268,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 20,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.24)",
    backgroundColor: "rgba(3, 20, 34, 0.32)",
  },

  // --------------------------
  // IMPOSTAZIONI
  // --------------------------

  tdSettingsPanel: {
    marginTop: 76,
    paddingTop: 24,
    paddingBottom: 24,
  },

  settingsScrollContent: {
    paddingBottom: 34,
  },

  settingToggleItemRow: {
    backgroundColor: "rgba(15, 46, 65, 0.92)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginVertical: 6,
    minHeight: 62,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.10)",
    shadowColor: "#000",
    shadowOpacity: 0.17,
    shadowRadius: 5,
    elevation: 3,
  },

  settingItemLabelText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#F8FAFC",
  },

  toggleBlockItem: {
    width: 52,
    height: 36,
    borderWidth: 1.4,
    borderColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: "#0F172A",
  },

  toggleActiveBlock: {
    backgroundColor: "#10B981",
    borderColor: "#34D399",
    shadowColor: "#34D399",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  toggleBlockText: {
    color: "#94A3B8",
    fontWeight: "900",
    fontSize: 13,
  },

  toggleBlockTextActive: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },

  tdSettingsSelectButton: {
    height: 42,
    minWidth: 120,
    borderRadius: 13,
    borderWidth: 1.6,
    borderColor: "rgba(148, 163, 184, 0.62)",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  languageDropdownAnchorTrigger: {
    height: 42,
    minWidth: 120,
    borderRadius: 13,
    borderWidth: 1.6,
    borderColor: "rgba(148, 163, 184, 0.62)",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  languageDropdownAnchorText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 15,
  },

  locationStatusInfoBox: {
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.76)",
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 11,
  },

  manualLocationTestCard: {
    backgroundColor: "rgba(10, 42, 58, 0.90)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.26)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 11,
  },

  manualLocationTitleText: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 5,
  },

  manualLocationHintText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 10,
  },

  manualLocationSelectButton: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.62)",
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  manualLocationSelectText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 13,
    textAlign: "center",
  },

  manualLocationOptionsContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.22)",
    overflow: "hidden",
    backgroundColor: "rgba(2, 16, 24, 0.96)",
  },

  manualLocationOptionsScroll: {
    maxHeight: 160,
  },

  manualLocationOptionItem: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.16)",
  },

  manualLocationOptionItemActive: {
    backgroundColor: "rgba(34, 211, 238, 0.18)",
  },

  manualLocationOptionText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  manualLocationActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  manualLocationActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: "#0369A1",
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  manualLocationStandardButton: {
    backgroundColor: "#334155",
    borderColor: "#94A3B8",
  },

  manualLocationActionText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },

  tdSettingsLogoutButton: {
    marginTop: 18,
    height: 54,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "#EF4444",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 6,
  },

  disconnectButton: {
    marginTop: 18,
    height: 54,
    backgroundColor: "#EF4444",
    borderRadius: 19,
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.34)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 6,
  },

  disconnectButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1.4,
  },

  // --------------------------
  // SCONTRO
  // --------------------------

  battleKeyboardScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  tdBattlePanel: {
    marginTop: 76,
    paddingTop: 24,
    paddingBottom: 24,
  },

  multiplayerActionCardBox: {
    backgroundColor: "rgba(15, 46, 65, 0.90)",
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "rgba(148, 163, 184, 0.28)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 4,
  },

  multiplayerSectionTitleText: {
    textAlign: "center",
    fontWeight: "900",
    color: "#38BDF8",
    fontSize: 17,
    marginBottom: 12,
    letterSpacing: 0.6,
  },

  tdBattlePremiumButton: {
    minHeight: 55,
    borderRadius: 20,
    borderWidth: 2.3,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(3, 72, 120, 0.98)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.24,
    shadowRadius: 11,
    elevation: 8,
  },

  lobbyCodeInputField: {
    backgroundColor: "#0F172A",
    borderWidth: 1.6,
    borderColor: "#64748B",
    borderRadius: 13,
    color: "#F8FAFC",
    paddingHorizontal: 12,
    height: 46,
    textAlign: "center",
    fontWeight: "900",
    marginBottom: 12,
  },

  battleStatusText: {
    color: "#CBD5E1",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 14,
    marginTop: 6,
  },

  fancyButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 2.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.62)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  tdMenuPrimaryGroup: {
    width: "100%",
    gap: 13,
  },

  tdMenuPrimaryButton: {
    height: 70,
    borderRadius: 21,
    borderWidth: 2.4,
    borderColor: "#38E8FF",
    backgroundColor: "rgba(5, 54, 91, 0.96)",
    shadowColor: "#22D3EE",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },

  tdMenuPrimaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 1.8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  tdMenuSecondaryRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
  },

  tdMenuSecondaryButton: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    borderWidth: 2.1,
    borderColor: "rgba(56, 232, 255, 0.94)",
    backgroundColor: "rgba(5, 54, 91, 0.96)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 5,
  },

  tdMenuSecondaryButtonText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1.2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.66)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },

  shopScrollLayout: {
    paddingTop: 94,
    paddingHorizontal: 14,
    paddingBottom: 36,
    gap: 14,
  },

  shopItemCardRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(5, 36, 58, 0.92)",
    borderWidth: 2,
    borderRadius: 18,
    padding: 13,
    gap: 13,
    minHeight: 164,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 5,
  },

  shopItemIconPreviewBox: {
    width: 94,
    height: 94,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  shopItemMetaDetailsInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  shopItemNameText: {
    color: "#F8FAFC",
    fontWeight: "900",
    fontSize: 21,
    lineHeight: 25,
    marginBottom: 7,
  },

  shopDualButtonsRowContainer: {
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
    width: "100%",
  },

  shopLeftButtonSlot: {
    width: "100%",
    minHeight: 44,
    justifyContent: "center",
  },

  shopRightButtonSlot: {
    width: "100%",
    minHeight: 44,
    justifyContent: "center",
  },

  shopItemMainActionButton: {
    width: "100%",
    height: 44,
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 10,
  },

  shopActionButtonText: {
    fontSize: 13,
    letterSpacing: 0.8,
  },

  alreadyBoughtBadge: {
    width: "100%",
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(15, 46, 65, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(74, 222, 128, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  alreadyBoughtText: {
    color: "#4ADE80",
    fontWeight: "900",
    fontSize: 13,
    textAlign: "center",
  },

  resultOutcomeCard: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 7,
  },

  outcomeCardWin: {
    backgroundColor: "rgba(6, 78, 59, 0.94)",
    borderColor: "#6EE7B7",
  },

  outcomeCardLose: {
    backgroundColor: "rgba(88, 28, 28, 0.94)",
    borderColor: "#FCA5A5",
  },

  resultContainerContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 44,
    alignItems: "center",
  },

  resultOutcomeCard: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 7,
  },

  outcomeActionBtn: {
    width: "90%",
    maxWidth: 340,
    alignSelf: "center",
    marginVertical: 6,
    backgroundColor: "#1E293B",
    borderColor: "#475569",
  },

  centerShowcaseItemBox: {
    width: "86%",
    maxWidth: 360,
    minHeight: 150,
    alignSelf: "center",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },

  ecoResultBox: {
    width: "86%",
    maxWidth: 360,
    minHeight: 150,
    alignSelf: "center",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 12,
    elevation: 7,
  },

  showcaseItemVisualWrap: {
    width: 96,
    height: 96,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  educationalReportBox: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "rgba(6, 32, 48, 0.84)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.42)",
    marginBottom: 24,
  },

  battleDifficultySelectorBox: {
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  battleDifficultyButtonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },

  battleDifficultyButton: {
    flex: 1,
    minHeight: 42,
    marginVertical: 0,
  },

  plantRunnerStage: {
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
    position: "relative",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.30)",
    backgroundColor: "rgba(3, 20, 34, 0.38)",
  },

  miniRunnerDragonTouchArea: {
    position: "absolute",
    left: 2,
    bottom: 34,
    width: 138,
    height: 118,
    zIndex: 8,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  plantRunnerCharacter: {
    width: 112,
    height: 95,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  runnerDinoBodyWrap: {
    width: 99,
    height: 93,
    zIndex: 3,
  },

  educationalReportBox: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: "rgba(6, 32, 48, 0.84)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34, 211, 238, 0.42)",
    marginBottom: 24,
  },

  educationalReportScrollArea: {
    maxHeight: 230,
    width: "100%",
  },

  educationalReportScrollContent: {
    paddingBottom: 8,
  },

  battleEndScrollContent: {
    flexGrow: 1,
    paddingBottom: 34,
  },

  // FINE PATCH BOTTONI SCHERMATE PREMIUM

});
