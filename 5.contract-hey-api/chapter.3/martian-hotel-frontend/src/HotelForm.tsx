import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { createHotel, type HotelUpsert, updateHotel } from "@/api";
import { zHotelStatus, zHotelUpsert } from "@/api/zod.gen";
import { isValidationError } from "@/lib/is-validation-error";
import { $hotelContent, $hotels } from "@/stores/hotels";
import { $router } from "@/stores/router";

function FieldError({ error }: { error?: { message?: string } }) {
  if (!error) {
    return null;
  }

  return (
    <span
      style={{
        color: "#dc2626",
        fontSize: "0.8rem",
        display: "block",
        marginTop: 4,
      }}
    >
      {error.message}
    </span>
  );
}

export function HotelForm() {
  const router = useStore($router);
  const hotelData = useStore($hotelContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = router?.route === "hotelEdit";
  const hotelId = isEditMode ? router.params.id : undefined;

  const form = useForm<HotelUpsert>({
    defaultValues: {
      name: undefined,
      location: undefined,
      status: undefined,
    },
    resolver: zodResolver(zHotelUpsert),
  });

  useEffect(() => {
    if (hotelData?.data) {
      form.reset({
        name: hotelData.data.name,
        location: hotelData.data.location,
        status: hotelData.data.status,
      });
    }
  }, [hotelData?.data, form]);

  const onSubmit = async (data: HotelUpsert) => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);

    try {
      if (isEditMode && hotelId) {
        await updateHotel({
          path: { id: hotelId },
          body: data,
        });
      } else {
        await createHotel({
          body: data,
        });
      }

      alert("Hotel saved!");
      $hotels.invalidate();
      $router.set({ route: "hotelList" });
    } catch (error) {
      console.error(error);

      if (isValidationError(error)) {
        const { errors } = error;

        if (errors) {
          Object.entries(errors).forEach(([fieldName, errorMessage]) => {
            form.setError(fieldName as keyof HotelUpsert, {
              message: errorMessage,
              type: "server",
            });
          });
        }
      }

      alert("Failed to save hotel");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && hotelData?.loading) {
    return <div>Loading...</div>;
  }

  if (isEditMode && hotelData?.error) {
    return <div>Error: {hotelData.error.message}</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} style={{ maxWidth: 400 }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Hotel Name</label>
        <input
          {...form.register("name")}
          placeholder="Olympus Mons Resort"
          style={{ width: "100%", padding: "10px 12px" }}
        />
        <FieldError error={form.formState.errors.name} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 6 }}>
          Location on Mars
        </label>
        <input
          {...form.register("location")}
          placeholder="Valles Marineris"
          style={{ width: "100%", padding: "10px 12px" }}
        />
        <FieldError error={form.formState.errors.location} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Status</label>
        <select
          {...form.register("status")}
          style={{ width: "100%", padding: "10px 12px" }}
        >
          <option value="">Select status</option>
          {zHotelStatus.options.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
        <FieldError error={form.formState.errors.status} />
      </div>

      <button
        className="btn-primary"
        type="submit"
        disabled={isSubmitting}
        style={{ padding: "10px 20px" }}
      >
        {isSubmitting ? "Saving..." : "Save Hotel"}
      </button>
    </form>
  );
}
