import { type Request, type Response } from "express";
import ScholarshipServices from "../services/scholarship.services";
import { IScholarshipData } from "../types/scholarships.type";
import OpenAI from "openai";
import config from "../config/config";
import { ChatCompletionMessageParam } from "../types/openAi.type";
import { Auth } from "../models/auth.schema";
import jwt from "jsonwebtoken";

const ScholarshipController = {
   handleGetAllScholarships: async (_: Request, res: Response) => {
      const allScholarships = await ScholarshipServices.getAll();
      return res.json({ data: allScholarships });
   },

   handleCreateScholarship: async (req: Request, res: Response) => {
      const { accessToken, refreshToken } = req.cookies;
      const requiredFields = [
         "name",
         "university",
         "description",
         "country",
         "city",
         "major",
         "email",
         "degrees",
         "funding_type",
         "open_date",
         "close_date",
      ];

      // Check if accessToken is present
      if (!accessToken) {
         // Check if refreshToken is present for renewal
         if (!refreshToken) {
            return res.status(401).json({ message: "Need to relogin" });
         }

         try {
            // Verify the refresh token
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
            const activeRefreshToken = await Auth.findOne({ token: refreshToken });

            if (!activeRefreshToken) {
               return res.status(401).json({ message: "Invalid refresh token. Please relogin." });
            }

            // Decode refresh token to get user data
            const payload = jwt.decode(refreshToken) as { id: string; name: string; email: string };
            if (!payload) {
               return res.status(401).json({ message: "Invalid token payload. Please relogin." });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
               {
                  id: payload.id,
                  name: payload.name,
                  email: payload.email,
               },
               process.env.JWT_ACCESS_SECRET as string,
               { expiresIn: 300 }, // Token valid for 5 minutes
            );

            // Set the new access token in cookies and proceed with update logic
            res.cookie("accessToken", newAccessToken, { httpOnly: true });
         } catch (_error) {
            return res.status(401).json({ message: "Token verification failed. Need to relogin." });
         }
      } else {
         try {
            // Verify access token
            jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string);
         } catch (_error) {
            return res.status(401).json({ message: "Invalid access token. Please relogin." });
         }
      }

      // Check for missing required fields
      // Check that all required fields have been provided.
      // The required fields are specified in the requiredFields array.
      // If any of the required fields are missing, return a 400 error with a helpful message.
      for (const field of requiredFields) {
         // For each required field, check if it exists in the request body
         if (!req.body[field]) {
            // If it doesn't exist, return an error
            return res.status(400).json({ error: `The ${field} field is required.` });
         }
      }

      // Create method to create new scholarship.
      try {
         const newScholarshipData: IScholarshipData = req.body;
         // method to create new scholarship into the database
         const createScholarship = await ScholarshipServices.createScholarship(newScholarshipData);

         // return response
         return res
            .status(201)
            .json({ message: "New Scholarship created successfully", data: { _id: createScholarship._id } });
      } catch {
         return res.status(500).json({ error: "Failed to create the scholarship." });
      }
   },

   handleUpdateScholarship: async (req: Request, res: Response) => {
      const { accessToken, refreshToken } = req.cookies;
      const scholarshipId = req.params.id;

      // Check if accessToken is present
      if (!accessToken) {
         // Check if refreshToken is present for renewal
         if (!refreshToken) {
            return res.status(401).json({ message: "Need to relogin" });
         }

         try {
            // Verify the refresh token
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
            const activeRefreshToken = await Auth.findOne({ token: refreshToken });

            if (!activeRefreshToken) {
               return res.status(401).json({ message: "Invalid refresh token. Please relogin." });
            }

            // Decode refresh token to get user data
            const payload = jwt.decode(refreshToken) as { id: string; name: string; email: string };
            if (!payload) {
               return res.status(401).json({ message: "Invalid token payload. Please relogin." });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
               {
                  id: payload.id,
                  name: payload.name,
                  email: payload.email,
               },
               process.env.JWT_ACCESS_SECRET as string,
               { expiresIn: 300 }, // Token valid for 5 minutes
            );

            // Set the new access token in cookies and proceed with update logic
            res.cookie("accessToken", newAccessToken, { httpOnly: true });
         } catch (_error) {
            return res.status(401).json({ message: "Token verification failed. Need to relogin." });
         }
      } else {
         try {
            // Verify access token
            jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string);
         } catch (_error) {
            return res.status(401).json({ message: "Invalid access token. Please relogin." });
         }
      }

      // method Update the scholarship
      try {
         // business logic to update a scholarship
         // Call the service to update the scholarship
         // The service will handle the business logic of updating the scholarship
         // The service will return the updated scholarship
         // If the service returns null, that means the scholarship was not found
         const updatedScholarship = await ScholarshipServices.updateScholarship(
            scholarshipId, // the id of the scholarship to update
            req.body, // the updated data to apply to the scholarship
         );

         if (!updatedScholarship) {
            return res.status(404).json({ message: "Scholarship not found" });
         }

         // return response
         return res.json({ message: "Scholarship updated successfully", updatedScholarship });
      } catch (error) {
         // We want to return a 500 error with a JSON body containing information about the error, but we need to be careful because the error object might not be an instance of Error.  This is because the error object might be an arbitrary object that was thrown by the code in the try block, or it might be a string, or it might be null, or it might be undefined, or it might be something else entirely.

         // So, we first check if the error object is an instance of Error.  If it is, then we know that it has a message property, and we can return a 500 error with a JSON body containing that message.

         // If the error object is not an instance of Error, then we don't know what properties it has, so we can't return a 500 error with a JSON body containing information about the error.  In this case, we just return a 500 error with a generic error message.

         // Narrow the type of error
         return res.status(500).json({
            error: "Server error",
            details: error instanceof Error ? error.message : "An unknown error occurred",
         });
      }
   },

   handleGetScholarshipById: async (req: Request, res: Response) => {
      // Get the id parameter from the request parameters.
      // This is a string because that's what Express.js uses
      // for its request parameters.
      const { accessToken, refreshToken } = req.cookies;

      // Check if accessToken is present
      if (!accessToken) {
         // Check if refreshToken is present for renewal
         if (!refreshToken) {
            return res.status(401).json({ message: "Need to relogin" });
         }

         try {
            // Verify the refresh token
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
            const activeRefreshToken = await Auth.findOne({ token: refreshToken });

            if (!activeRefreshToken) {
               return res.status(401).json({ message: "Invalid refresh token. Please relogin." });
            }

            // Decode refresh token to get user data
            const payload = jwt.decode(refreshToken) as { id: string; name: string; email: string };
            if (!payload) {
               return res.status(401).json({ message: "Invalid token payload. Please relogin." });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
               {
                  id: payload.id,
                  name: payload.name,
                  email: payload.email,
               },
               process.env.JWT_ACCESS_SECRET as string,
               { expiresIn: 300 }, // Token valid for 5 minutes
            );

            // Set the new access token in cookies and proceed with update logic
            res.cookie("accessToken", newAccessToken, { httpOnly: true });
         } catch (_error) {
            return res.status(401).json({ message: "Token verification failed. Need to relogin." });
         }
      } else {
         try {
            // Verify access token
            jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string);
         } catch (_error) {
            return res.status(401).json({ message: "Invalid access token. Please relogin." });
         }
      }

      // Get the id parameter from the request parameters.
      const scholarshipId = req.params.id;
      try {
         // Call the service to get the scholarship by id
         const foundScholarship = await ScholarshipServices.getScholarshipById(scholarshipId);
         if (!foundScholarship) {
            return res.status(404).json({ error: "Scholarship not found" });
         }

         // return response
         return res.json({ data: foundScholarship });
      } catch (error) {
         const typedError = error as Error;
         return res.status(500).json({ message: typedError.message || "Server error", error: "failed to get data" });
      }
   },

   handleDeleteScholarship: async (req: Request, res: Response) => {
      // Get the id parameter from the request parameters.
      // This is a string because that's what Express.js uses
      // for its request parameters.
      const scholarshipId = req.params.id;
      const { accessToken } = req.cookies; // Mengambil accessToken dari cookie (atau bisa dari header jika diperlukan)

      // This will be used to fetch the scholarship details from
      // the database, and then update it with the new data
      // provided in the request body.

      // check accessToken exists or not
      if (!accessToken) {
         return res.status(401).json({ message: "access token is missing. Please login again." });
      }

      try {
         // if accessToken is valid, then delete scholarship
         const deletedResult = await ScholarshipServices.deleteScholarship(scholarshipId);

         if (!deletedResult) {
            return res.status(404).json({ error: "Scholarship not found" });
         }

         // Return Success response
         return res.status(200).json({ message: "Scholarship deleted successfully", data: { _id: deletedResult._id } });
      } catch (error) {
         const typedError = error as Error;
         return res.status(500).json({ message: typedError.message || "Server error", error: "failed to delete data" });
      }
   },

   handleGetData: async (req: Request, res: Response) => {
      try {
         const { country, major, degrees, funding_type, email } = req.body;
         console.log(country, major, degrees, funding_type, email);
         const allScholarships = await ScholarshipServices.getScholarshipByData(country, major, degrees, funding_type);
         // console.log(allScholarships)
         const userProfile = await ScholarshipServices.getUserProfile(email);
         const openai = new OpenAI({
            apiKey: config.OPENAI_API_KEY,
         });
         const mResponse = { userProfile: userProfile, scholarships: allScholarships };

         // Define the messages correctly without the unnecessary MessageContent structure.
         const messages: ChatCompletionMessageParam[] = [
            {
               role: "system",
               content:
                  "You are an expert education consultant and good at viewing student profiles to get scholarships:\n\nIMPORTANT\nthe output should be only valid JSON with the following keys:\n- relevancy: percentage\n- shortDescription: string\n- pros and cons analysis\n\nIMPORTANT\nINPUT SCHOLARSHIP LIST IN JSON FORMAT",
            },
         ];

         // Using just a single string for user messages
         mResponse.scholarships.forEach((scholarship) => {
            messages.push({
               role: "user",
               content: `{"type": "text", "text": "Analyze the suitability of your profile to this scholarship program PROFILE: ${JSON.stringify(
                  mResponse.userProfile,
               )} SCHOLARSHIP: ${JSON.stringify(scholarship)}"}`,
            });
         });

         // Call the OpenAI API with the prepared messages
         const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 1,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
         });

         const hasilAI = [
            {
               rekomendasi: response.choices[0].message.content,
               listBeasiswa: mResponse.scholarships,
            },
         ];
         // console.log(hasilAI);
         // console.log(mResponse);

         return res.status(200).json(hasilAI);
      } catch (error) {
         console.error(error);
         return res.status(500).json({ error: "An error occurred while processing your request." });
      }
   },
};

export default ScholarshipController;
