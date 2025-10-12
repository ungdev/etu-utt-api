import UeCommentAuthorResDto from "./ue-comment-author-res.dto";

export default class UeCommentReportResDto {
    id: string;
    body: string;
    createdAt: Date;
    mitigated: boolean;
    reportedBody: string;
    user: UeCommentAuthorResDto & {studentId: number};
    reason: string;
}