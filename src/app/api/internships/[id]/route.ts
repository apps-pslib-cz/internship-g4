import { Internship } from "@prisma/client";
import { type NextRequest } from "next/server";
import { auth } from "@/auth";
import prisma from "@/utils/db";
import { Role } from "@/types/auth";
import {
  InternshipFullRecord,
  InternshipWithCompanyLocationSetUser,
} from "@/types/entities";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  let internship:
    | InternshipWithCompanyLocationSetUser
    | InternshipFullRecord
    | null;
  if (session.user.role === Role.ADMIN || session.user.role === Role.TEACHER) {
    internship = await prisma.internship.findFirst({
      include: {
        set: true,
        user: true,
        company: {
          include: {
            location: true,
          },
        },
        location: true,
        reservationUser: true,
      },
      where: { id: id },
    });
  } else {
    internship = await prisma.internship.findFirst({
      select: {
        id: true,
        classname: true,
        created: true,
        kind: true,
        userId: true,
        companyId: true,
        setId: true,
        locationId: true,
        companyRepName: true,
        companyRepEmail: true,
        companyRepPhone: true,
        companyMentorName: true,
        companyMentorEmail: true,
        companyMentorPhone: true,
        jobDescription: true,
        appendixText: true,
        additionalInfo: true,
        state: true,
        conclusion: true,
        user: {
          select: {
            givenName: true,
            surname: true,
            email: true,
            image: true,
          },
        },
        company: {
          select: {
            name: true,
            companyIdentificationNumber: true,
            locationId: true,
          },
        },
        location: {
          select: {
            municipality: true,
          },
        },
        set: {
          select: {
            name: true,
            year: true,
            editable: true,
            active: true,
            daysTotal: true,
            hoursDaily: true,
            start: true,
            end: true,
            continuous: true,
          },
        },
      },
      where: { id: id },
    });
  }
  if (!internship) {
    return new Response("Not found", {
      status: 404,
    });
  }
  if (
    session.user.role !== Role.ADMIN &&
    session.user.role !== Role.TEACHER &&
    session.user.id !== internship?.userId
  ) {
    return new Response("Forbidden", {
      status: 403,
    });
  }
  return Response.json(internship);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const id = params.id;

  if (!session) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  let internship = await prisma.internship.findFirst({
    include: {
      set: true,
    },
    where: { id: id },
  });

  if (
    session.user.role !== Role.ADMIN &&
    session.user.id !== internship?.userId
  ) {
    return new Response("Forbidden", {
      status: 403,
    });
  }
  if (internship === null) {
    return new Response("Not found", {
      status: 404,
    });
  }
  if (internship.set.editable === false) {
    return new Response("Set of this internship is not editable.", {
      status: 402,
    });
  }

  await prisma.internship.delete({
    where: { id: id },
  });
  return new Response(JSON.stringify(internship), {
    status: 200,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const id = params.id;

  if (!session) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  const setIfDefined = <T extends object>(obj: Partial<T>, key: keyof T, value: any) => {
    if (value !== undefined) (obj as any)[key] = value;
  };

  const allowedForAll = [
    "companyRepName","companyRepEmail","companyRepPhone",
    "companyMentorName","companyMentorEmail","companyMentorPhone",
    "jobDescription","appendixText","additionalInfo","classname","conclusion",
  ] as const;

  const allowedForStaff = ["kind","state","setId","companyId","locationId","reservationUserId","highlighted"] as const;

  let internship = await prisma.internship.findFirst({
    where: { id: id },
  });

  if (!internship) {
    return new Response("Not found", {
      status: 404,
    });
  }

  let set = await prisma.set.findFirst({
    where: { id: internship.setId },
  });

  if (!set) {
    return new Response("Set not found", {
      status: 404,
    });
  }

  if (
    session.user.role !== Role.ADMIN &&
    session.user.role !== Role.TEACHER &&
    session.user.id !== internship?.userId
  ) {
    return new Response("Forbidden", {
      status: 403,
    });
  }

  if (session.user.role !== Role.ADMIN && set.editable === false) {
    return new Response("Set of this internship is not editable.", {
      status: 400,
    });
  }
  const body = await request.json();

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.TEACHER) {
    body.reservationUserId = internship.reservationUserId;
    body.highlighted = internship.highlighted;
    body.state = internship.state;
  }

  const updatedData: Partial<Internship> = {};
  for (const k of allowedForAll) setIfDefined(updatedData, k, body[k]);

  if (session.user.role === Role.ADMIN || session.user.role === Role.TEACHER) {
    for (const k of allowedForStaff) setIfDefined(updatedData, k as any, body[k as any]);
  } else {
    updatedData.reservationUserId = internship.reservationUserId;
    updatedData.highlighted = internship.highlighted;
    updatedData.state = internship.state;
  }
  updatedData.updated = new Date();

  console.log("RES", updatedData);

  await prisma.internship.update({
    where: { id: id },
    data: updatedData,
  });
  return new Response(JSON.stringify(updatedData), {
    status: 200,
  });
}
